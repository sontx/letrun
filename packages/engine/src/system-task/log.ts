import { Description, Name, Parameters, validateParameters } from '@letrun/core';
import { TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';

/**
 * Interface representing the parameters for the LogTaskHandler.
 */
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

/**
 * Schema for validating the task parameters.
 */
const Schema = Joi.object<TaskParameters>({
  level: Joi.string().default('info').valid('debug', 'info', 'warn', 'error'),
  message: Joi.string().required(),
});

/**
 * Class representing the handler for the log task.
 * Implements the TaskHandler interface.
 */
@Name('log')
@Description('Outputs messages or errors for debugging')
@Parameters(Schema)
export class LogTaskHandler implements TaskHandler {
  /**
   * Handles the task execution.
   * @param {TaskHandlerInput} input - The input for the task handler.
   */
  handle({ task, context }: TaskHandlerInput) {
    const { level, message } = validateParameters(task.parameters, Schema);
    context.getLogger()[level](message);
  }
}
