import { TaskHandler, TaskHandlerInput, TaskHandlerOutput, validateParameters } from '@letrun/core';
import Joi from 'joi';
import * as fs from 'node:fs';

interface TaskParameters {
  path: string;
  contentType: 'json' | 'text' | 'line';
}

const Schema = Joi.object<TaskParameters>({
  path: Joi.string().description('The file path to read from').required(),
  contentType: Joi.string()
    .description('The file content type should be converted to')
    .default('text')
    .valid('json', 'text', 'line'),
});

export default class Handler implements TaskHandler {
  name = 'read-file';
  parameters = Schema.describe();

  async handle({ task, context }: TaskHandlerInput): Promise<TaskHandlerOutput> {
    const { contentType, path } = validateParameters(task.parameters, Schema);
    context.getLogger().debug(`Reading from file: ${path}`);
    const content = await fs.promises.readFile(path, 'utf8');
    switch (contentType) {
      case 'json':
        return JSON.parse(content);
      case 'line':
        // split the content by line, the new line character may be different on different OS
        return content.split(/\r?\n/);
      default:
        return content;
    }
  }
}
