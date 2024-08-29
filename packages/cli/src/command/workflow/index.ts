import { AbstractCommand } from '../abstract.command';
import { Command } from 'commander';
import { ViewCommand } from './view.command';
import { ListCommand } from './list.command';
import { DeleteCommand } from './delete.command';
import { ClearCommand } from './clear.command';
import { InstallCommand } from './install.command';

export class WorkflowCommand extends AbstractCommand {
  load(program: Command): void {
    const command = program.command('workflow [command]').description('manage workflows');

    new ViewCommand(this.context).load(command);
    new ListCommand(this.context).load(command);
    new DeleteCommand(this.context).load(command);
    new ClearCommand(this.context).load(command);
    new InstallCommand(this.context).load(command);
  }
}
