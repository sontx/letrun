import { Description, Name, Output, Parameters, validateParameters } from '@letrun/core';
import { TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';

interface TaskParameters {
  /**
   * The log level for the message.
   * @type {'debug' | 'info' | 'warn' | 'error'}
   */
  level: 'debug' | 'info' | 'warn' | 'error';

  /**
   * The message to log.
   * @type {string}
   */
  message: string;
}

const Schema = Joi.object<TaskParameters>({
  level: Joi.string().default('info').valid('debug', 'info', 'warn', 'error'),
  message: Joi.string().required(),
});

@Name('log')
@Description('Outputs messages or errors for debugging')
@Parameters(Schema)
@Output()
export class LogTaskHandler implements TaskHandler {
  handle({ task, context }: TaskHandlerInput) {
    const { level, message } = validateParameters(task.parameters, Schema);
    context.getLogger()[level](message);
  }
}
