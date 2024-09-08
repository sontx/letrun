import {
  delayMs,
  Description,
  DisplayName,
  Icon,
  Keywords,
  Name,
  Output,
  Parameters,
  validateParameters,
} from '@letrun/core';
import { TaskHandler, TaskHandlerInput } from '@letrun/common';
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

const OutputSchema = Joi.any().description('The "data" field from the input parameters');

@Name('delay')
@DisplayName('Delay')
@Keywords('delay', 'wait', 'time')
@Description('Delays the execution of the workflow for a specified amount of time')
@Icon('https://raw.githubusercontent.com/sontx/letrun/main/icons/delay.svg')
@Parameters(Schema)
@Output(OutputSchema)
export class DelayTaskHandler implements TaskHandler {
  async handle({ task, context, session }: TaskHandlerInput) {
    const { time, data } = validateParameters(task.parameters, Schema);
    const delayMillis = typeof time === 'string' ? ms(time) : time;
    context.getLogger().verbose(`Delaying execution for ${delayMillis} milliseconds`);
    await delayMs(delayMillis, session.signal);
    return data;
  }
}
