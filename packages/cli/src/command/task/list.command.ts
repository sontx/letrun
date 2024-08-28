import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import treeify, { TreeObject } from 'treeify';
import { EMOJIS } from '@src/ui';
import { SystemTaskManager, TaskHelper } from '@letrun/engine';

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
    const systemTasks = SystemTaskManager.getSystemTasks();
    const tree: TreeObject = {};
    const withFields = this.parseArrayOption(options.with);
    for (const name in systemTasks) {
      tree[`${EMOJIS.NUT_AND_BOLT} ${systemTasks[name]!.name}`] = this.extractFields(
        systemTasks[name],
        withFields,
        true,
      );
    }

    console.log(`Total system tasks: ${Object.keys(tree).length}`);
    console.log(treeify.asTree(tree, true, true).trim());
  }

  private async listCustomTasks(options: AbstractOptions) {
    const customTasks = await TaskHelper.loadCustomTasksFromConfig(this.context);

    const rootTree: TreeObject = {};
    const withFields = this.parseArrayOption(options.with);

    for (const task of customTasks) {
      const filePath = task.path!;
      const parents = TaskHelper.extractParentDirs(filePath).map((dir) => `${EMOJIS.FOLDER} ${dir}`);
      let currentNode = rootTree;
      for (const parent of parents) {
        if (!currentNode[parent]) {
          currentNode[parent] = {};
        }
        currentNode = currentNode[parent] as TreeObject;
      }
      currentNode[`${task.isPackage ? EMOJIS.PACKAGE : EMOJIS.ROBOT} ${task.name}`] = this.extractFields(
        task,
        withFields,
        true,
      );
    }

    console.log(`\nTotal custom tasks: ${customTasks.length}`);
    console.log(treeify.asTree(rootTree, true, true).trim());
  }
}
