import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import { INPUT_PARAMETER_PLUGIN, InputParameter } from '@letrun/core';
import fs from 'fs';
import { LogHelper } from '@src/command/libs/log-helper';
import { DefaultRunner, SystemTaskManager, TaskHelper } from '@letrun/engine';
import { TaskHandler, WorkflowDef } from "@letrun/common";

const SUPPORT_RUN_SYSTEM_TASKS = ['log', 'http'];

export class RunCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('run')
      .description('run a task')
      .argument('<name>', 'name of the task')
      .option('-i, --input <input>', 'input for the task, can be a file path or a JSON string')
      .option(
        '-g, --group <group>',
        'group of the task, use "." if you want to search tasks  that doesn\'t have a group',
      )
      .option('-o, --output <output>', 'output file which contains the result of the task')
      .option('-p, --pipe', 'Pipe the output to the next command', false)
      .action(async (name, options) => {
        await this.doAction(name, options);
      });
  }

  private async doAction(name: string, options: AbstractOptions) {
    if (options.pipe) {
      await LogHelper.usePipeMode(this.context, async () => {
        return await this.decideTask(name, options);
      });
    } else {
      return await this.decideTask(name, options);
    }
  }

  private async decideTask(name: string, options: AbstractOptions) {
    if (SUPPORT_RUN_SYSTEM_TASKS.includes(name)) {
      return await this.runSystemTask(name, options);
    } else {
      return await this.runCustomTask(name, options);
    }
  }

  private async runSystemTask(name: string, options: AbstractOptions) {
    const systemTasks = SystemTaskManager.getSystemTasks();
    if (systemTasks[name]) {
      const task = systemTasks[name]!;
      return await this.runTask(
        {
          ...task,
          fullPath: name,
        },
        options,
      );
    } else {
      this.context.getLogger().error(`System task "${name}" not found`);
    }
  }

  private async runCustomTask(name: string, options: AbstractOptions) {
    const customTasks = await TaskHelper.loadCustomTasksFromConfig(this.context);
    const group = options.group;
    const tasks = TaskHelper.searchTasks(customTasks, name, group);

    if (tasks.length === 0) {
      this.context.getLogger().error(`Task "${name}" not found`);
    } else if (tasks.length > 1) {
      const foundGroups = [...new Set(tasks.map((task) => task.group))];
      if (foundGroups.length > 1) {
        this.context.getLogger().error(`Multiple tasks found with name "${name}", please specify the group.`);
      } else {
        this.context
          .getLogger()
          .error(
            `Multiple tasks found with name "${name}" with the same group ${foundGroups[0]}, we do not recommend this.`,
          );
      }
    } else {
      return await this.runTask(tasks[0] as any, options);
    }
  }

  private async runTask(task: TaskHandler & { fullPath: string }, options: AbstractOptions) {
    const inputParameter = await this.context.getPluginManager().getOne<InputParameter>(INPUT_PARAMETER_PLUGIN);
    const input = await inputParameter.read(options.input ?? '{}');

    const workflow: WorkflowDef = {
      name: 'letrun',
      tasks: [
        {
          name: task.name!,
          parameters: input,
          handler: task.fullPath,
        },
      ],
    };

    const runner = new DefaultRunner();
    try {
      await runner.load(this.context);
      const ranWorkflow = await runner.run(workflow);
      if (options.output) {
        await fs.promises.writeFile(options.output, JSON.stringify(ranWorkflow?.output ?? '', null, 2), 'utf8');
      }
      return ranWorkflow?.output;
    } finally {
      await runner.unload();
    }
  }
}
