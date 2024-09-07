import { validateParameters } from '@letrun/core';
import { TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';
import * as fs from 'node:fs';

interface TaskParameters {
  path: string;
  append?: boolean;
  content: any;
}

const Schema = Joi.object<TaskParameters>({
  path: Joi.string().description('The file path to read from').required(),
  content: Joi.any().description('The content to write to the file').required(),
  append: Joi.boolean().description('Append to the file instead of overwriting').default(false),
});

export default class Handler implements TaskHandler {
  name = 'write-file';
  parameters = Schema.describe();

  async handle({ task, context }: TaskHandlerInput) {
    const { append, path, content } = validateParameters(task.parameters, Schema);
    const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    context.getLogger().debug(`Writing to file: ${path}`);
    await fs.promises.writeFile(path, textContent, { flag: append ? 'a' : 'w' });
  }
}
