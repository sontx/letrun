import Joi from 'joi';
import {
  Description,
  DisplayName,
  Icon,
  Keywords,
  Name,
  Output,
  Parameters,
  SCRIPT_ENGINE_PLUGIN,
  ScriptEngine,
  validateParameters,
  wrapPromiseWithAbort,
} from '@letrun/core';
import { TaskHandler, TaskHandlerInput } from '@letrun/common';
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

const OutputSchema = Joi.any().description('The result of the lambda expression.');

@Name('lambda')
@DisplayName('Lambda')
@Keywords('lambda', 'expression', 'eval', 'evaluate', 'script')
@Description('Evaluates a lambda expression.')
@Icon('https://raw.githubusercontent.com/sontx/letrun/main/icons/lambda.svg')
@Parameters(Schema)
@Output(OutputSchema)
export class LambdaTaskHandler implements TaskHandler {
  async handle(taskInput: TaskHandlerInput) {
    const { task, context, session } = taskInput;
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

    return await wrapPromiseWithAbort(
      engineWrapper.run(effectiveExpression, {
        input,
        file,
        language,
      }),
      session.signal,
    );
  }
}
