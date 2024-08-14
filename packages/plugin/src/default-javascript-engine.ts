import { AbstractPlugin, AppContext, JAVASCRIPT_PLUGIN, JavaScriptEngine, ObjectType } from '@letrun/core';
import vm from 'vm';

export default class DefaultJavascriptEngine extends AbstractPlugin implements JavaScriptEngine {
  readonly name = 'default';
  readonly type = JAVASCRIPT_PLUGIN;

  async run(script: string, context: ObjectType) {
    if (!script) {
      return undefined;
    }

    const val = vm.runInNewContext(script, context);
    return val instanceof Promise ? await val : val;
  }

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    await this.injectConfig();
  }
}
