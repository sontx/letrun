import {
  AbstractPlugin,
  AppContext,
  BUILTIN_PLUGIN_PRIORITY,
  ObjectType,
  SCRIPT_ENGINE_PLUGIN,
  ScriptEngine,
} from '@letrun/core';
import vm from 'vm';

export default class JavascriptEngine extends AbstractPlugin implements ScriptEngine {
  readonly name = 'javascript';
  readonly type = SCRIPT_ENGINE_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  async run(script: string, context: ObjectType) {
    if (!script) {
      return undefined;
    }

    const val = vm.runInNewContext(script, context);
    return val instanceof Promise ? await val : val;
  }

  support(extension: string): boolean {
    return extension === 'js';
  }

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    await this.injectConfig();
  }
}
