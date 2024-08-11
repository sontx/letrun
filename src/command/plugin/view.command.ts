import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import { asTree, TreeObject } from 'treeify';
import { EMOJIS } from '../../ui';

export class ViewCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('view')
      .description('view detail of a plugin')
      .requiredOption('-t, --type <type>', 'type of the plugin')
      .requiredOption('-n, --name <name>', 'name of the plugin')
      .action((options) => {
        return this.doAction(options);
      });
  }

  private async doAction(options: AbstractOptions) {
    const { name, type } = options;
    const plugins = await this.context.getPluginManager().get(type);
    const plugin = plugins.find((plugin) => plugin.name === name);
    if (!plugin) {
      this.context.getLogger().error(`Plugin not found: ${name}`);
    } else {
      console.log(`Type: ${plugin.type}`);
      console.log(`Name: ${plugin.name}`);
      const tree: TreeObject = {};
      const customMethods = this.getCustomMethods(plugin);
      for (const method of customMethods) {
        tree[`${EMOJIS.GEAR} ${method}`] = {};
      }
      console.log(asTree(tree, true, true).trim());
    }
  }

  private getCustomMethods(obj: any) {
    let methods = new Set<string>();
    let currentObj = obj;

    // Built-in methods to skip
    const builtInMethods = new Set([
      'constructor',
      'toString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      '__defineGetter__',
      '__defineSetter__',
      '__lookupGetter__',
      '__lookupSetter__',
      '__proto__',
    ]);

    // Traverse the prototype chain
    while (currentObj) {
      Object.getOwnPropertyNames(currentObj)
        .filter((prop) => typeof obj[prop] === 'function' && !builtInMethods.has(prop))
        .forEach((method) => methods.add(method));

      currentObj = Object.getPrototypeOf(currentObj);
    }

    return [...methods];
  }
}
