import { Plugin } from '../model';
import type { Command } from 'commander';

export const COMMAND_PLUGIN = 'command';

export interface CommandPlugin extends Plugin {
  register(program: Command): void;
}
