import { Description, Name, Parameters, validateParameters } from '@letrun/core';
import { RerunError, TaskDef, TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';
import { initNewIteration, validateLoopTask } from './loop-task';

/**
 * Interface representing the parameters for the ForTaskHandler.
 */
interface TaskParameters {
  /**
   * The starting value of the iterator.
   * @type {number}
   */
  from: number;

  /**
   * The ending value of the iterator.
   * @type {number}
   */
  to: number;

  /**
   * The step value to increment the iterator by each loop.
   * @type {number}
   * @default 1
   */
  step?: number;
}

/**
 * Schema for validating the task parameters.
 */
const Schema = Joi.object<TaskParameters>({
  from: Joi.number().description('The iterator will loop from this value').required(),
  to: Joi.number().description('The iterator will loop until reach this value').required(),
  step: Joi.number()
    .description("The iterator will plus this value each time it's looped until it reaches the 'to' value")
    .default(1),
});

/**
 * Class representing the handler for the 'for' task.
 * Implements the TaskHandler interface.
 */
@Name('for')
@Description('Loops through a specified range and performs tasks')
@Parameters(Schema)
export class ForTaskHandler implements TaskHandler {
  /**
   * Handles the task execution.
   * @param {TaskHandlerInput} input - The input for the task handler.
   * @returns {Promise<any>} The output of the task.
   * @throws {RerunError} To notify the engine to rerun the task for another iteration.
   */
  async handle({ task, context, session }: TaskHandlerInput): Promise<any> {
    const { from, to, step } = validateParameters(task.parameters, Schema);

    if (typeof task.output?.from !== 'number') {
      context.getLogger().debug(`Initializing for loop from ${from} to ${to} with step ${step}`);
      task.output = {
        index: from,
        iteration: 0,
        from,
        to,
        step,
      };
    }

    if (task.output.index > to) {
      context.getLogger().debug(`'For' loop finished after looping ${task.output.iteration + 1} times`);
      return task.output;
    }

    context.getLogger().verbose(`Running iteration ${task.output.iteration + 1} with index ${task.output.index}`);
    initNewIteration(task, session);
    task.output.iteration++;
    task.output.index += step;

    // notify the engine to rerun the task for another iteration
    throw new RerunError();
  }
}

/**
 * Validates the 'for' task definition.
 * @param {TaskDef} taskDef - The task definition to validate.
 */
export function validateForTask(taskDef: TaskDef) {
  validateLoopTask('For')(taskDef);
}
