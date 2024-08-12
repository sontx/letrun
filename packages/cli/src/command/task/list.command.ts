import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import { asTree, TreeObject } from 'treeify';
import { getSystemTasks } from '../../system-task';
import { EMOJIS } from '../../ui';
import { extractParentDirs, loadCustomTasksFromConfig } from './helper';

export class ListCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('list')
      .description('list all tasks')
      .option('-c, --custom', 'list custom tasks')
      .option('-s, --system', 'list system tasks')
      .option('-w, --with <with>', 'with additional fields, ex: id,status')
      .action((options) => {
        return this.doAction(options);
      });
  }

  private async doAction(options: AbstractOptions) {
    const showSystemTasks = options.system || !options.custom;
    const showCustomTasks = options.custom || !options.system;
    if (showSystemTasks) {
      this.listSystemTasks(options);
    }
    if (showCustomTasks) {
      await this.listCustomTasks(options);
    }
  }

  private listSystemTasks(options: AbstractOptions) {
    const systemTasks = getSystemTasks();
    const tree: TreeObject = {};
    const withFields = this.parseArrayOption(options.with);
    for (const name in systemTasks) {
      tree[`${EMOJIS.NUT_AND_BOLT} ${systemTasks[name]!.name}`] = this.extractFields(
        systemTasks[name],
        withFields,
        true,
      );
    }

    console.log(`\nTotal system tasks: ${Object.keys(tree).length}`);
    console.log(asTree(tree, true, true).trim());
  }

  private async listCustomTasks(options: AbstractOptions) {
    const customTasks = await loadCustomTasksFromConfig(this.context);

    const rootTree: TreeObject = {};
    const withFields = this.parseArrayOption(options.with);

    for (const task of customTasks) {
      const filePath = task.path!;
      const parents = extractParentDirs(filePath).map((dir) => `${EMOJIS.FOLDER} ${dir}`);
      let currentNode = rootTree;
      for (const parent of parents) {
        if (!currentNode[parent]) {
          currentNode[parent] = {};
        }
        currentNode = currentNode[parent] as TreeObject;
      }
      currentNode[`${EMOJIS.ROBOT} ${task.name}`] = this.extractFields(task, withFields, true);
    }

    console.log(`\nTotal custom tasks: ${Object.keys(rootTree).length}`);
    console.log(asTree(rootTree, true, true).trim());
  }
}
