import { AbstractCommand, AbstractOptions } from './abstract.command';
import { Command } from 'commander';
import fs from 'fs';
import { DefaultRunner } from '../runner';
import {
  INPUT_PARAMETER_PLUGIN,
  InputParameter,
  Persistence,
  PERSISTENCE_PLUGIN,
  Workflow,
  WorkflowDef,
} from '@letrun/core';

export class RunCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('run', { isDefault: true })
      .description('run a workflow')
      .argument('<path>', 'path to the workflow file either in JSON or YAML format')
      .option('-i, --input <input>', 'input for the workflow, can be a file path or a JSON string')
      .option('-s, --save', 'whether to save the workflow after running it', false)
      .option('-o, --output <output>', 'Output file which contains the result of the workflow')
      .action(async (path, options) => {
        await this.doAction(path, options);
      });
  }

  private async doAction(path: string, options: AbstractOptions) {
    if (!fs.existsSync(path)) {
      this.context.getLogger().error(`File not found: ${path}`);
      return;
    }

    const inputParameter = await this.context.getPluginManager().getOne<InputParameter>(INPUT_PARAMETER_PLUGIN);

    const input = await inputParameter.read(options.input ?? '{}');
    const workflow = await inputParameter.read<WorkflowDef>(path);
    const runner = new DefaultRunner();

    let ranWorkflow: Workflow | undefined;
    try {
      await runner.load(this.context);
      ranWorkflow = await runner.run(workflow!, input);
      if (options.output) {
        await fs.promises.writeFile(options.output, JSON.stringify(ranWorkflow?.output ?? '', null, 2), 'utf8');
      }
    } finally {
      if (ranWorkflow && options.save) {
        const persistence = await this.context.getPluginManager().getOne<Persistence>(PERSISTENCE_PLUGIN);
        const workflowUnit = persistence.getUnit('workflow');
        await workflowUnit.save(ranWorkflow.id, ranWorkflow);
      }
      await runner.unload();
    }
  }
}
