import type { Command } from 'commander';
import { Plugin } from '@letrun/common';

export const COMMAND_PLUGIN = 'command';

export interface CommandPlugin extends Plugin {
  readonly type: typeof COMMAND_PLUGIN;

  register(program: Command): void;
}
