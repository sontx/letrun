import { Command } from 'commander';
import { RunCommand } from './run.command';
import { WorkflowCommand } from './workflow';
import { PluginCommand } from './plugin';
import { TaskCommand } from './task';
import { AppContext } from '@letrun/core';
export * from './helper';

export class CommandLoader {
  public static async load(program: Command, context: AppContext): Promise<void> {
    new RunCommand(context).load(program);
    new WorkflowCommand(context).load(program);
    new PluginCommand(context).load(program);
    new TaskCommand(context).load(program);
  }
}
