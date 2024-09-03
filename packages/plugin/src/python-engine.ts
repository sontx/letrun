import {
  AbstractPlugin,
  BUILTIN_PLUGIN_PRIORITY,
  SCRIPT_ENGINE_PLUGIN,
  ScriptEngine,
} from '@letrun/core';
import { PythonShell } from 'python-shell';
import tmp from 'tmp';
import fs from 'fs';
import { AppContext, ObjectType } from "@letrun/common";

/**
 * Evaluates Python script, there are some limitations:
 * - The context will be loaded into a 'context' variable as a dictionary in the script.
 * - The output should be assigned to the 'output' variable.
 * - The python executable path can be configured in the 'pythonPath' property if it's not found from the environment.
 */
export default class PythonEngine extends AbstractPlugin implements ScriptEngine {
  readonly name = 'python';
  readonly type = SCRIPT_ENGINE_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  private pythonPath?: string;

  async run(script: string, context: ObjectType) {
    if (!script) {
      return undefined;
    }

    if (this.pythonPath && !fs.existsSync(this.pythonPath)) {
      throw new Error(`Python executable not found at ${this.pythonPath}`);
    }

    const inputFile = tmp.fileSync({ postfix: '.json', prefix: 'letrun' });
    await fs.promises.writeFile(inputFile.name, JSON.stringify(context));

    try {
      const effectiveScript = `
import json
output = None
with open('${inputFile.name.replaceAll(/\\/g, '/')}', 'r') as file:
    context = json.load(file)
${script}
print(json.dumps(output))
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
