import type { Command } from 'commander';
import { Plugin } from '@src/model';

export const COMMAND_PLUGIN = 'command';

export interface CommandPlugin extends Plugin {
  readonly type: typeof COMMAND_PLUGIN;

  register(program: Command): void;
}
