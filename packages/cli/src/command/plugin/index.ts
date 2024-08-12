import { AbstractCommand } from '../abstract.command';
import { Command } from 'commander';
import { ListCommand } from './list.command';
import { ViewCommand } from './view.command';

export class PluginCommand extends AbstractCommand {
  load(program: Command): void {
    const command = program.command('plugin [command]').description('manage plugins');
    new ListCommand(this.context).load(command);
    new ViewCommand(this.context).load(command);
  }
}
