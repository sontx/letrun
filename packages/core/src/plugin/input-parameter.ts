import { Plugin } from '../model';

export const INPUT_PARAMETER_PLUGIN = 'input-parameter';

export interface InputParameter extends Plugin {
  read<T = any>(rawInput: string): Promise<T | null>;
}
