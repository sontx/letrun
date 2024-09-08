import { Description, DisplayName, Icon, Keywords, Name, Output, Parameters, validateParameters } from '@letrun/core';
import { RerunError, TaskDef, TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';
import { initNewIteration, validateLoopTask } from './loop-task';

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

const Schema = Joi.object<TaskParameters>({
  from: Joi.number().description('The iterator will loop from this value').required(),
  to: Joi.number().description('The iterator will loop until reach this value').required(),
  step: Joi.number()
    .description("The iterator will plus this value each time it's looped until it reaches the 'to' value")
    .default(1),
});

const OutputSchema = Joi.object({
  index: Joi.number().description('The current index of the loop, starting from the "from" value'),
  iteration: Joi.number().description('The current iteration of the loop, starting from 0'),
  from: Joi.number().description('The starting value of the loop'),
  to: Joi.number().description('The ending value of the loop'),
  step: Joi.number().description('The step value of the loop'),
});

@Name('for')
@DisplayName('For')
@Keywords('loop', 'iterate', 'each')
@Description('Loops through a specified range and performs tasks')
@Icon('https://raw.githubusercontent.com/sontx/letrun/main/icons/for.svg')
@Parameters(Schema)
@Output(OutputSchema)
export class ForTaskHandler implements TaskHandler {
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
