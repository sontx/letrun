import Joi from 'joi';
import {
  AppContext,
  JAVASCRIPT_PLUGIN,
  JavaScriptEngine,
  TaskHandler,
  TaskHandlerInput,
  validateParameters,
} from '@letrun/core';
import fs from 'fs';

interface TaskParameters {
  expression?: string;
  file?: string;
  input?: any;
  language?: 'javascript';
}

const Schema = Joi.object<TaskParameters>({
  expression: Joi.string().description('The expression to evaluate.'),
  file: Joi.string().description('The file to read the expression from.'),
  input: Joi.any().description('The input to use when evaluating the expression.'),
  language: Joi.string()
    .valid('javascript')
    .default('javascript')
    .description('The language to use when evaluating the expression.'),
})
  .xor('expression', 'file')
  .required();

export class LambdaTaskHandler implements TaskHandler {
  name = 'lambda';
  description = 'Evaluates a lambda expression.';
  parameters = Schema.describe();

  async handle({ task, context }: TaskHandlerInput) {
    const { expression, file, input, language } = validateParameters(task.parameters, Schema);

    let effectiveExpression = expression!;
    if (file) {
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }
      effectiveExpression = await fs.promises.readFile(file, 'utf8');
    }

    switch (language) {
      case 'javascript':
        context.getLogger().debug(`Evaluating JavaScript expression: ${effectiveExpression}`);
        return await this.runJavaScript(context, effectiveExpression, input);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private async runJavaScript(context: AppContext, expression: string, input: any) {
    const javascriptEngine = await context.getPluginManager().getOne<JavaScriptEngine>(JAVASCRIPT_PLUGIN);
    return await javascriptEngine.run(expression, { input });
  }
}
