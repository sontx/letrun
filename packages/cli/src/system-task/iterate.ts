import { RerunError, TaskDef, TaskHandler, TaskHandlerInput, validateParameters } from '@letrun/core';
import Joi from 'joi';
import {initNewIteration, validateLoopTask} from './loop-task';

interface TaskParameters {
  items: any[] | Map<string, any> | Set<any>;
}

const Schema = Joi.object<TaskParameters>({
  items: Joi.alternatives(Joi.array().items(Joi.any()), Joi.object().pattern(Joi.string(), Joi.any()))
    .description('An array of items to iterate over')
    .required(),
});

export class IterateTaskHandler implements TaskHandler {
  name: string = 'iterate';
  description: string = 'Loops through a list of items and performs tasks';
  parameters: Joi.Description = Schema.describe();

  async handle({ task, context, session }: TaskHandlerInput): Promise<any> {
    const { items } = validateParameters(task.parameters, Schema);

    if (!task.output?.iteration) {
      context.getLogger().verbose(`Initializing new iteration for task ${task.id}`);
      task.output.iteration = 0;
    } else {
      task.output.iteration++;
    }

    const itemArray = Array.isArray(items) ? items : items instanceof Set ? [...items] : [...items.entries()];
    const iterationItem = itemArray[task.output.iteration];

    if (iterationItem) {
      context.getLogger().verbose(`Running iteration ${task.output.iteration} for task ${task.id}`);
      task.output.item = iterationItem;
      initNewIteration(task, session);
      // notify the engine to rerun the task for another iteration
      throw new RerunError();
    }

    context.getLogger().verbose(`No more items to iterate over for task ${task.id}`);
    delete task.output.item;
    return task.output;
  }
}

/**
 * Validates the 'for' task definition.
 * @param {TaskDef} taskDef - The task definition to validate.
 */
export function validateIterateTask(taskDef: TaskDef) {
  validateLoopTask('Iterate')(taskDef);
}
