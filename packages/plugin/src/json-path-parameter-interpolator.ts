import {
  AbstractPlugin,
  AppContext,
  BUILTIN_PLUGIN_PRIORITY,
  ConfigNotFoundError,
  PARAMETER_INTERPOLATOR_PLUGIN,
  ParameterInterpolator,
} from '@letrun/core';
import { JSONPath } from 'jsonpath-plus';

export default class JsonPathParameterInterpolator extends AbstractPlugin implements ParameterInterpolator {
  private flatten: boolean = false;
  private recursive: boolean = true;

  readonly name = 'json-path';
  readonly type = PARAMETER_INTERPOLATOR_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  interpolate<T = any>(value: string, interpolatorContext: any, throwIfNotFound = false): T {
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
      this.context?.getLogger()?.verbose(`Resolved JSON path: ${currentValue} --> ${result}`);
      currentValue = result;
    } while (this.recursive && this.isJsonPath(currentValue));
    if (throwIfNotFound && currentValue === undefined) {
      throw new ConfigNotFoundError(`The json path ${value} was not found`);
    }
    return (currentValue !== undefined ? currentValue : value) as T;
  }

  private isJsonPath(str: any) {
    if (typeof str !== 'string' || !str) {
      return false;
    }

    // Define a regular expression for a simple JSON path validation
    const jsonPathRegex = /^(\$|\$\.|\$\[|\$\[(\d+|'.*?'|"?.*?")\]|(@|\.\w+|\['\w+'\]|\["\w+"\]|[.*?])+)+$/;
    return jsonPathRegex.test(str);
  }

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    await this.injectConfig();
  }
}
