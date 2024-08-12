import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import treeify from 'treeify';
import { Persistence, PERSISTENCE_PLUGIN } from '@letrun/core';
import { FIELD_TRANSFORMERS } from './helper';
import { EMOJIS } from '../../ui';

export class ListCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('list')
      .description('list all saved workflows')
      .option('-m, --max <max>', 'the maximum number of workflows to list', '30')
      .option('-o, --offset <offset>', 'the offset to start listing workflows', '0')
      .option('-w, --with <with>', 'with additional fields, ex: id,status')
      .action((options) => {
        return this.doAction(options);
      });
  }

  private async doAction(options: AbstractOptions) {
    const persistence = await this.context.getPluginManager().getOne<Persistence>(PERSISTENCE_PLUGIN);
    const workflowUnit = persistence.getUnit('workflow');
    const workflowIds = await workflowUnit.list();
    const max = parseInt(options.max, 10);
    const offset = parseInt(options.offset, 10);
    const showingCount = Math.min(max, Math.max(0, workflowIds.length - offset));
    const showingIds = workflowIds.slice(offset, offset + showingCount);
    const withFields = this.parseArrayOption(options.with);

    let message = '';
    for (const workflowId of showingIds) {
      try {
        const workflow = await workflowUnit.load(workflowId);
        if (workflow) {
          message += `${EMOJIS.ROCKET} ${workflowId}\n${treeify.asTree(
            {
              name: workflow.name,
              ...this.extractFields(workflow, withFields, true, FIELD_TRANSFORMERS),
            },
            true,
            true,
          )}`;
        }
      } catch (e: any) {
        message += `${EMOJIS.BOOM} ${workflowId}\n${treeify.asTree({ error: e.message }, true, true)}`;
      }
    }

    console.log(
      `\nShowing ${showingCount} workflow(s)${showingCount < workflowIds.length ? ` out of ${workflowIds.length}` : ''}`,
    );

    if (message) {
      console.log('\n' + message.trim());
    }
  }
}
