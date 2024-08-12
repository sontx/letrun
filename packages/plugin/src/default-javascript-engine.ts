import { AppContext, JAVASCRIPT_PLUGIN, JavaScriptEngine, loadConfigToPlugin, ObjectType } from '@letrun/core';
import vm from 'vm';

export default class DefaultJavascriptEngine implements JavaScriptEngine {
  readonly name = 'default';
  readonly type = JAVASCRIPT_PLUGIN;

  async run(script: string, context: ObjectType) {
    if (!script) {
      return undefined;
    }

    const val = vm.runInNewContext(script, context);
    return val instanceof Promise ? await val : val;
  }

  async load(context: AppContext) {
    const config = context.getConfigProvider().getAll();
    loadConfigToPlugin(config, this);
  }

  unload(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
