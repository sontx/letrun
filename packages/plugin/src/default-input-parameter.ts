import { AbstractPlugin, INPUT_PARAMETER_PLUGIN, InputParameter } from '@letrun/core';
import fs from 'fs';
import { parse } from 'yaml';

export default class DefaultInputParameter extends AbstractPlugin implements InputParameter {
  readonly name = 'default';
  readonly type = INPUT_PARAMETER_PLUGIN;

  async read<T = any>(rawInput: string): Promise<T | null> {
    if (!rawInput) {
      return null;
    }

    const ext = rawInput.split('.').pop()?.toLowerCase();
    if (['json', 'yaml', 'yml'].includes(ext ?? '') && fs.existsSync(rawInput)) {
      const fileContent = await fs.promises.readFile(rawInput, 'utf8');
      if (ext === 'json') {
        return JSON.parse(fileContent);
      }
      return parse(fileContent);
    }

    return JSON.parse(rawInput);
  }
}
