import { AbstractCommand } from '../abstract.command';
import { Command } from 'commander';
import { Persistence, PERSISTENCE_PLUGIN } from '@letrun/core';

export class ClearCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('clear')
      .description('clear all saved workflows')
      .action(() => {
        return this.doAction();
      });
  }

  private async doAction() {
    const persistence = await this.context.getPluginManager().getOne<Persistence>(PERSISTENCE_PLUGIN);
    const workflowUnit = persistence.getUnit('workflow');
    const workflowIds = await workflowUnit.list();
    for (const id of workflowIds) {
      await workflowUnit.remove(id);
    }
  }
}
