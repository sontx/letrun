import {
  AppContext,
  ConfigNotFoundError,
  loadConfigToPlugin,
  Logger,
  PARAMETER_INTERPOLATOR_PLUGIN,
  ParameterInterpolator,
} from '@letrun/core';
import JsonPathParameterInterpolator from './json-path-parameter-interpolator';

export default class ExpressionParameterInterpolator implements ParameterInterpolator {
  private jsonPath = new JsonPathParameterInterpolator();
  private recursive: boolean = true;
  private logger?: Logger;

  readonly name = 'expression';
  readonly type = PARAMETER_INTERPOLATOR_PLUGIN;
  readonly priority = 1;

  async load(context: AppContext) {
    this.logger = context.getLogger();
    const config = context.getConfigProvider().getAll();
    loadConfigToPlugin(config, this);
    await this.jsonPath.load(context);
  }

  interpolate<T = any>(value: string, interpolatorContext: any): T {
    if (!this.isExpression(value)) {
      return value as T;
    }

    let currentValue = value;
    do {
      let expressionKey = this.extractKeyFromExpression(currentValue);
      if (expressionKey.startsWith('input.')) {
        expressionKey = `workflow.${expressionKey}`;
      } else if (expressionKey.startsWith('variables.')) {
        expressionKey = `workflow.${expressionKey}`;
      }

      const jsonPathKey = expressionKey ? `$.${expressionKey}` : '$';
      try {
        const result = this.jsonPath.interpolate(jsonPathKey, interpolatorContext, true);
        this.logger?.verbose(`Resolved expression: ${currentValue} --> ${result}`);
        currentValue = result;
      } catch (e: any) {
        if (e instanceof ConfigNotFoundError) {
          return value as T;
        }
        throw e;
      }
    } while (this.recursive && this.isExpression(currentValue));
    return currentValue as T;
  }

  private isExpression(str: any) {
    if (typeof str !== 'string' || !str) {
      return false;
    }

    // Define a regular expression for a simple expression validation
    const expressionRegex = /^(\${.*?})+$/;
    return expressionRegex.test(str);
  }

  private extractKeyFromExpression(expression: string) {
    return expression.substring(2, expression.length - 1);
  }

  async unload() {
    await this.jsonPath.unload();
  }
}
