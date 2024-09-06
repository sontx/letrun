import { Description, Name, Parameters, validateParameters } from '@letrun/core';
import { TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';
import { expect } from 'expect';

interface TaskParameters {
  match:
    | 'toBe'
    | 'toBeDefined'
    | 'toBeFalsy'
    | 'toBeNull'
    | 'toBeTruthy'
    | 'toBeUndefined'
    | 'toBeNaN'
    | 'toBeGreaterThan'
    | 'toBeGreaterThanOrEqual'
    | 'toBeLessThan'
    | 'toBeLessThanOrEqual'
    | 'toContain'
    | 'toContainEqual'
    | 'toEqual'
    | 'toStrictEqual'
    | 'toHaveLength'
    | 'toMatch'
    | 'toMatchObject';
  object: any;
  value?: any;
  not?: boolean;
  message?: string;
}

const Schema = Joi.object<TaskParameters>({
  match: Joi.string()
    .description("What you expect from the 'object'")
    .valid(
      'toBe',
      'toBeDefined',
      'toBeFalsy',
      'toBeNull',
      'toBeTruthy',
      'toBeUndefined',
      'toBeNaN',
      'toBeGreaterThan',
      'toBeGreaterThanOrEqual',
      'toBeLessThan',
      'toBeLessThanOrEqual',
      'toContain',
      'toContainEqual',
      'toEqual',
      'toStrictEqual',
      'toHaveLength',
      'toMatch',
      'toMatchObject',
    ),
  object: Joi.any().description('The object to test').required(),
  value: Joi.any().description("The value to test against 'object'"),
  not: Joi.boolean().description('Invert the test result'),
  message: Joi.string().description('The message to throw when the test fails'),
});

@Name('expect')
@Description('Tests the object against the expected value')
@Parameters(Schema)
export default class Handler implements TaskHandler {
  async handle({ task, context }: TaskHandlerInput) {
    const value = validateParameters(task.parameters, Schema);
    context.getLogger()?.debug(`Expecting ${value.object} ${value.match} ${value.value ?? ''}`);
    const checkFn = () => {
      const expectFn = expect(value.object);
      if (value.not) {
        expectFn.not[value.match](value.value);
      } else {
        expectFn[value.match](value.value);
      }
    };

    task.output = false;

    if (value.message) {
      try {
        checkFn();
      } catch (error: any) {
        context.getLogger()?.debug(`Expect failed: ${error.message}`);
        throw new Error(value.message);
      }
    } else {
      checkFn();
    }

    return true;
  }
}
