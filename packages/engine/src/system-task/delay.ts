import { delayMs, TaskHandler, TaskHandlerInput, TaskHandlerOutput, validateParameters } from '@letrun/core';
import Joi from 'joi';
import ms from 'ms';

interface TaskParameters {
  time: string | number;
  data?: any;
}

const Schema = Joi.object<TaskParameters>({
  time: Joi.alternatives(Joi.string(), Joi.number())
    .description('The time to delay, it can be a readable string (1s, 2m, 3 hours...) or a number in milliseconds')
    .required(),
  data: Joi.any().description('The data to pass to the output on time out'),
});

export class DelayTaskHandler implements TaskHandler {
  name: string = 'delay';
  description: string = 'Delays the execution of the workflow for a specified amount of time';
  parameters: Joi.Description = Schema.describe();

  async handle({ task, context }: TaskHandlerInput): Promise<TaskHandlerOutput> {
    const { time, data } = validateParameters(task.parameters, Schema);
    const delayMillis = typeof time === 'string' ? ms(time) : time;
    context.getLogger().verbose(`Delaying execution for ${delayMillis} milliseconds`);
    await delayMs(delayMillis);
    return data;
  }
}
