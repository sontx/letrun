import {
  AbstractPlugin,
  AppContext,
  BUILTIN_PLUGIN_PRIORITY,
  ObjectType,
  SCRIPT_ENGINE_PLUGIN,
  ScriptEngine,
} from '@letrun/core';
import { PythonShell } from 'python-shell';
import tmp from 'tmp';
import fs from 'fs';

export default class PythonEngine extends AbstractPlugin implements ScriptEngine {
  readonly name = 'javascript';
  readonly type = SCRIPT_ENGINE_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  private pythonPath?: string;

  async run(script: string, context: ObjectType) {
    if (!script) {
      return undefined;
    }

    const inputFile = tmp.fileSync({ postfix: '.json', prefix: 'letrun-' });
    await fs.promises.writeFile(inputFile.name, JSON.stringify(context));

    try {
      const effectiveScript = `
import json
with open('${inputFile.name.replaceAll(/\\/g, '/')}', 'r') as file:
    input = json.load(file)
${script}
`;
      const resultArray = await PythonShell.runString(effectiveScript, {
        mode: 'text',
        pythonPath: this.pythonPath,
      });
      const lastResult = resultArray[resultArray.length - 1];

      // try parse to json, if failed, return the raw string
      try {
        return JSON.parse(lastResult);
      } catch {
        return lastResult;
      }
    } finally {
      inputFile.removeCallback();
    }
  }

  support(extension: string): boolean {
    return extension === 'py';
  }

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    await this.injectConfig();
  }
}
