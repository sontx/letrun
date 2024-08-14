import { Plugin } from '@src/model';

/**
 * Constant representing the input parameter plugin type.
 * @type {string}
 */
export const INPUT_PARAMETER_PLUGIN = 'input-parameter';

/**
 * Interface representing an Input Parameter plugin which controls how the raw input is parsed/loaded.
 * Extends the Plugin interface.
 */
export interface InputParameter extends Plugin {
  read<T = any>(rawInput: string): Promise<T | null>;
}
