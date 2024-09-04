import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import treeify, { TreeObject } from 'treeify';
import { EMOJIS } from '@src/ui';
import { TaskHandler } from '@letrun/common';
import { SystemTaskManager, TaskHelper } from '@letrun/engine';

export class ViewCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('view')
      .description('view detail of a task')
      .argument('<name>', 'name of the task')
      .option(
        '-g, --group <group>',
        'group of the task, use "." if you want to search tasks that doesn\'t have a group',
      )
      .action((name, options) => {
        return this.doAction(name, options);
      });
  }

  private async doAction(name: string, options: AbstractOptions) {
    const systemTasks = SystemTaskManager.getSystemTasks();
    if (systemTasks[name]) {
      this.viewTask(systemTasks[name], true);
    } else {
      await this.viewCustomTask(name, options.group);
    }
  }

  private async viewCustomTask(name: string, group?: string) {
    const customTasks = await TaskHelper.loadCustomTasksFromConfig(this.context);
    const tasks = TaskHelper.searchTasks(customTasks, name, group);

    if (tasks.length === 0) {
      this.context.getLogger().error(`Task "${name}" not found`);
      return;
    } else if (tasks.length > 1) {
      const foundGroups = [...new Set(tasks.map((task) => task.group))];
      if (foundGroups.length > 1) {
        this.context.getLogger().warn(`Multiple tasks found with name "${name}", please specify the group.`);
      } else {
        this.context
          .getLogger()
          .warn(
            `Multiple tasks found with name "${name}" with the same group ${foundGroups[0]}, we do not recommend this.`,
          );
      }
    }

    for (const task of tasks) {
      this.viewTask(task, false);
    }
  }

  private viewTask(task: Partial<TaskHandler> & { group?: string; isPackage?: boolean }, isSystem: boolean) {
    let tree: TreeObject = this.extractFields(
      task,
      ['group', 'version', 'description', 'parameters', 'fullPath'],
      true,
    );
    console.log(`${isSystem ? EMOJIS.NUT_AND_BOLT : task.isPackage ? EMOJIS.PACKAGE : EMOJIS.ROBOT} ${task.name}`);
    console.log(treeify.asTree(tree, true, true).trim());
  }
}
