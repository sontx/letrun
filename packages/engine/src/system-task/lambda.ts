import Joi from 'joi';
import { SCRIPT_ENGINE_PLUGIN, ScriptEngine, TaskHandler, TaskHandlerInput, validateParameters } from '@letrun/core';
import fs from 'fs';
import { ScriptEngineWrapper } from '@src/libs/script-engine-wrapper';

interface TaskParameters {
  expression?: string;
  file?: string;
  input?: any;
  language?: string;
}

const Schema = Joi.object<TaskParameters>({
  expression: Joi.string().description('The expression to evaluate.'),
  file: Joi.string().description('The file to read the expression from.'),
  input: Joi.any().description('The input to use when evaluating the expression.'),
  language: Joi.string().description('The language to use when evaluating the expression.'),
})
  .xor('expression', 'file')
  .required();

export class LambdaTaskHandler implements TaskHandler {
  name = 'lambda';
  description = 'Evaluates a lambda expression.';
  parameters = Schema.describe();

  async handle(taskInput: TaskHandlerInput) {
    const { task, context } = taskInput;
    const { expression, file, input, language } = validateParameters(task.parameters, Schema);

    let effectiveExpression = expression!;
    if (file) {
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }
      effectiveExpression = await fs.promises.readFile(file, 'utf8');
    }

    const scriptEngines = await context.getPluginManager().get<ScriptEngine>(SCRIPT_ENGINE_PLUGIN);
    const engineWrapper = new ScriptEngineWrapper(scriptEngines);

    return await engineWrapper.run(effectiveExpression, {
      input,
      file,
      language,
    });
  }
}
