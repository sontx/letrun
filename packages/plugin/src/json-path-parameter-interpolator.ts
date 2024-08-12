import {
  AppContext,
  loadConfigToPlugin,
  Logger,
  PARAMETER_INTERPOLATOR_PLUGIN,
  ParameterInterpolator,
} from '@letrun/core';
import { JSONPath } from 'jsonpath-plus';

export default class JsonPathParameterInterpolator implements ParameterInterpolator {
  private flatten: boolean = false;
  private recursive: boolean = true;
  private logger?: Logger;

  readonly name = 'json-path';
  readonly type = PARAMETER_INTERPOLATOR_PLUGIN;

  interpolate<T = any>(value: string, interpolatorContext: any): T {
    if (!this.isJsonPath(value)) {
      return value as T;
    }

    let currentValue = value;
    do {
      const result = JSONPath({
        path: currentValue,
        json: interpolatorContext,
        resultType: 'value',
        wrap: false,
        flatten: this.flatten,
      });
      this.logger?.verbose(`Resolved JSON path: ${currentValue} --> ${result}`);
      currentValue = result;
    } while (this.recursive && this.isJsonPath(currentValue));
    return currentValue as T;
  }

  private isJsonPath(str: any) {
    if (typeof str !== 'string' || !str) {
      return false;
    }

    // Define a regular expression for a simple JSON path validation
    const jsonPathRegex = /^(\$|\$\.|\$\[|\$\[(\d+|'.*?'|"?.*?")\]|(@|\.\w+|\['\w+'\]|\["\w+"\]|[.*?])+)+$/;
    return jsonPathRegex.test(str);
  }

  async load(context: AppContext) {
    this.logger = context.getLogger();
    const config = context.getConfigProvider().getAll();
    loadConfigToPlugin(config, this);
  }

  unload(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
