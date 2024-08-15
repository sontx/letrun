import {
  AbstractPlugin,
  AppContext,
  BUILTIN_PLUGIN_PRIORITY,
  ConfigNotFoundError,
  PARAMETER_INTERPOLATOR_PLUGIN,
  ParameterInterpolator,
} from '@letrun/core';
import JsonPathParameterInterpolator from './json-path-parameter-interpolator';

export default class ExpressionParameterInterpolator extends AbstractPlugin implements ParameterInterpolator {
  private jsonPath = new JsonPathParameterInterpolator();
  private recursive: boolean = true;

  readonly name = 'expression';
  readonly type = PARAMETER_INTERPOLATOR_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    await this.injectConfig();
    await this.jsonPath.load(context);
  }

  interpolate<T = any>(value: string, interpolatorContext: any): T {
    if (!this.isExpression(value)) {
      return value as T;
    }

    let currentValue = value;
    let match;

    while ((match = /\${(.*?)}/g.exec(currentValue)) !== null) {
      let expressionKey = match[1]!;
      if (expressionKey.startsWith('input.')) {
        expressionKey = `workflow.${expressionKey}`;
      } else if (expressionKey.startsWith('variables.')) {
        expressionKey = `workflow.${expressionKey}`;
      }

      const jsonPathKey = expressionKey ? `$.${expressionKey}` : '$';
      try {
        const result = this.jsonPath.interpolate(jsonPathKey, interpolatorContext, true);
        this.context?.getLogger()?.verbose(`Resolved expression: ${match[0]} --> ${result}`);
        currentValue = currentValue.replaceAll(match[0], result);
        if (!this.recursive) {
          break;
        }
      } catch (e: any) {
        if (e instanceof ConfigNotFoundError) {
          return value as T;
        }
        throw e;
      }
    }
    return currentValue as T;
  }

  private isExpression(str: any) {
    if (typeof str !== 'string' || !str) {
      return false;
    }

    // Define a regular expression for detecting expressions within a string
    const expressionRegex = /\${.*?}/;
    return expressionRegex.test(str);
  }

  protected async doUnload(): Promise<void> {
    await super.doUnload();
    await this.jsonPath.unload();
  }
}
