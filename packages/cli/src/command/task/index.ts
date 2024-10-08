import { AbstractCommand } from '../abstract.command';
import { Command } from 'commander';
import { ListCommand } from './list.command';
import { ViewCommand } from './view.command';
import { RunCommand } from './run.command';
import { InstallCommand } from './install.command';
import { VersionsCommand } from './versions.command';
import { MetaCommand } from './meta.command';

export class TaskCommand extends AbstractCommand {
  load(program: Command): void {
    const command = program.command('task [command]').description('manage tasks');
    new ListCommand(this.context).load(command);
    new ViewCommand(this.context).load(command);
    new RunCommand(this.context).load(command);
    new InstallCommand(this.context).load(command);
    new VersionsCommand(this.context).load(command);
    new MetaCommand(this.context).load(command);
  }
}
