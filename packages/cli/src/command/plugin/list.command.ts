import { AbstractCommand } from '../abstract.command';
import { Command } from 'commander';
import treeify, { TreeObject } from 'treeify';
import { EMOJIS } from '../../ui';

export class ListCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('list')
      .description('list all installed plugins')
      .action(() => {
        return this.doAction();
      });
  }

  private async doAction() {
    const pluginMap = await this.context.getPluginManager().getAll();

    let total = 0;
    const pluginTrees: Record<string, TreeObject> = {};

    for (const [type, plugins] of pluginMap.entries()) {
      pluginTrees[type] = {};
      for (const plugin of plugins) {
        pluginTrees[type][`${EMOJIS.GEAR} ${plugin.name}`] = {};
        total++;
      }
    }

    console.log(`\nTotal plugins: ${total}\n`);
    let message = '';
    for (const type in pluginTrees) {
      message += `${EMOJIS.FOLDER} ${type}\n${treeify.asTree(pluginTrees[type]!, true, true)}`;
    }
    if (message) {
      console.log(message.trim());
    }
  }
}
