import { asTree, TreeObject } from 'treeify';
import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import fs from 'fs';
import { Container, Persistence, PERSISTENCE_PLUGIN, Workflow } from '@letrun/core';
import { FIELD_TRANSFORMERS } from './helper';
import { EMOJIS } from '../../ui';

export class ViewCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('view')
      .description('view a workflow')
      .argument('<pathOrId>', 'path to the workflow file or workflow id')
      .option('-w, --with <with>', 'show additional fields, ex: id,status')
      .action((pathOrId, options) => {
        return this.doAction(pathOrId, options);
      });
  }

  private async loadWorkflow(pathOrId: string) {
    if (!fs.existsSync(pathOrId)) {
      const persistence = await this.context.getPluginManager().getOne<Persistence>(PERSISTENCE_PLUGIN);
      const workflowUnit = persistence.getUnit('workflow');
      const workflow = await workflowUnit.load(pathOrId);
      if (!workflow) {
        this.context.getLogger().error(`Workflow not found: ${pathOrId}`);
        return undefined;
      }
      return workflow;
    } else {
      const content = await fs.promises.readFile(pathOrId, { encoding: 'utf-8' });
      return JSON.parse(content) as Workflow;
    }
  }

  private async doAction(pathOrId: string, options: AbstractOptions) {
    const workflow = await this.loadWorkflow(pathOrId);
    if (!workflow) {
      return;
    }

    const withFields = this.parseArrayOption(options.with);

    const getNodeTitle = (container: Container) => {
      return container.runtimeName ?? container.name;
    };

    const buildNode = (container: Container) => {
      return this.extractFields(container, withFields, true, FIELD_TRANSFORMERS);
    };

    let totalTasks = 0;
    const buildRecursiveTasks = (root: TreeObject, container: Container) => {
      const tasks = Array.isArray(container.tasks)
        ? container.tasks
        : Object.keys(container.tasks ?? {}).map((key) => ({
            ...(container.tasks as any)[key]!,
            name: key,
          }));

      for (const task of tasks) {
        const node = buildNode(task);
        root[`${EMOJIS.ROBOT} ${getNodeTitle(task)}`] = node;
        buildRecursiveTasks(node, task);
      }

      totalTasks += tasks.length;
    };

    const rootTree: TreeObject = {};
    buildRecursiveTasks(rootTree, workflow);

    const tree = asTree(rootTree, true, true);

    console.log(`\n${'status' in workflow ? 'Workflow' : 'Workflow Definition'}: ${workflow.name}`);
    const node = buildNode(workflow);
    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      if (i < keys.length - 1) {
        console.log(`├─ ${key}: ${node[key]}`);
      } else {
        console.log(`└─ ${key}: ${node[key]}`);
      }
    }

    console.log(`\nTasks view: ${totalTasks} task(s)`);
    console.log(tree.trim());
  }
}
