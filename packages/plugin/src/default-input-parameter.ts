import { AbstractPlugin, BUILTIN_PLUGIN_PRIORITY, INPUT_PARAMETER_PLUGIN, InputParameter } from '@letrun/core';
import fs from 'fs';
import { parse } from 'yaml';

export default class DefaultInputParameter extends AbstractPlugin implements InputParameter {
  readonly name = 'default';
  readonly type = INPUT_PARAMETER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  async read<T = any>(rawInput: string): Promise<T | null> {
    if (!rawInput) {
      return null;
    }

    const ext = rawInput.split('.').pop()?.toLowerCase();
    if (['json', 'yaml', 'yml'].includes(ext ?? '')) {
      if (!fs.existsSync(rawInput)) {
        throw new Error(`File not found: ${rawInput}`);
      }
      const fileContent = await fs.promises.readFile(rawInput, 'utf8');
      if (ext === 'json') {
        return JSON.parse(fileContent);
      }
      return parse(fileContent);
    }

    return JSON.parse(rawInput);
  }
}
