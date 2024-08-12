import { AbstractCommand } from '../abstract.command';
import { Command } from 'commander';
import { Persistence, PERSISTENCE_PLUGIN } from '@letrun/core';

export class DeleteCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('delete')
      .description('delete a saved workflow')
      .argument('<id>', 'workflow id to delete')
      .action((id) => {
        return this.doAction(id);
      });
  }

  private async doAction(id: string) {
    const persistence = await this.context.getPluginManager().getOne<Persistence>(PERSISTENCE_PLUGIN);
    const workflowUnit = persistence.getUnit('workflow');
    await workflowUnit.remove(id);
  }
}
