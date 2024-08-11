import { TaskHandler, TaskHandlerInput, TaskHandlerOutput, validateParameters } from '@letrun/core';
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
export class LogTaskHandler implements TaskHandler {
  /**
   * The name of the task handler.
   * @type {string}
   */
  name: string = 'log';

  /**
   * The description of the task handler.
   * @type {string}
   */
  description: string = 'Outputs messages or errors for debugging';

  /**
   * The parameters schema for the task handler.
   * @type {Joi.Description}
   */
  parameters: Joi.Description = Schema.describe();

  /**
   * Handles the task execution.
   * @param {TaskHandlerInput} input - The input for the task handler.
   * @returns {Promise<TaskHandlerOutput>} The output of the task.
   */
  async handle({ task, context }: TaskHandlerInput): Promise<TaskHandlerOutput> {
    const { level, message } = validateParameters(task.parameters, Schema);
    context.getLogger()[level](message);
  }
}
