import { Description, Name, Output, Parameters, validateParameters } from '@letrun/core';
import { TaskHandler, TaskHandlerInput } from '@letrun/common';
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

const OutputSchema = Joi.any().description('The content of the file depending on the contentType');

@Name('read-file')
@Description('Reads the content of a file')
@Parameters(Schema)
@Output(OutputSchema)
export default class Handler implements TaskHandler {
  async handle({ task, context }: TaskHandlerInput) {
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
