import { injectFieldDecorator } from '@src/utils';
import { TaskHandler } from '@letrun/common';
import type Joi from 'joi';

/**
 * A decorator that injects the name field to a {@link TaskHandler}. See {@link TaskHandler.name}.
 * @param value - task handler name.
 * @constructor
 *
 * @example
 * ```ts
 * @Name('my-task-handler')
 * class MyTaskHandler implements TaskHandler {
 * }
 * ```
 */
export function Name(value: string) {
  return injectFieldDecorator('name', value);
}

/**
 * A decorator that injects the version field to a {@link TaskHandler}. See {@link TaskHandler.version}.
 * @param value - task handler version.
 * @constructor
 *
 * @example
 * ```ts
 * @Version('1.0.0')
 * class MyTaskHandler implements TaskHandler {
 * }
 * ```
 */
export function Version(value: string) {
  return injectFieldDecorator('version', value);
}

/**
 * A decorator that injects the description field to a {@link TaskHandler}. See {@link TaskHandler.description}.
 * @param value - task handler description.
 * @constructor
 *
 * @example
 * ```ts
 * @Description('This is a task handler')
 * class MyTaskHandler implements TaskHandler {
 * }
 * ```
 */
export function Description(value: string) {
  return injectFieldDecorator('description', value);
}

/**
 * A decorator that injects the icon field to a {@link TaskHandler}. See {@link TaskHandler.icon}.
 * @param value
 * @constructor
 *
 * @example
 * ```ts
 * @Icon('https://example.com/icon.png')
 * class MyTaskHandler implements TaskHandler {
 * }
 * ```
 */
export function Icon(value: string) {
  return injectFieldDecorator('icon', value);
}

/**
 * A decorator that injects the parameters field to a {@link TaskHandler}. See {@link TaskHandler.parameters}.
 * @param value - task handler parameters. If value is not provided, the parameters field will be set to null (no parameters are required).
 * @constructor
 *
 * @example
 * ```ts
 * @Parameters(Joi.object({
 *   name: Joi.string().required(),
 * }))
 * class MyTaskHandler implements TaskHandler {
 * }
 * ```
 */
export function Parameters(value?: Joi.Description | Joi.Schema | null) {
  const effectiveValue = !value ? null : isJoiSchema(value) ? value.describe() : value;
  return injectFieldDecorator('parameters', effectiveValue);
}

/**
 * A decorator that injects the output field to a {@link TaskHandler}. See {@link TaskHandler.output}.
 * @param value - task handler output. If value is not provided, the output field will be set to null (no output).
 * @constructor
 *
 * @example
 * ```ts
 * @Output(Joi.object({
 *   value: Joi.string().required(),
 * }))
 * class MyTaskHandler implements TaskHandler {
 * }
 * ```
 */
export function Output(value?: Joi.Description | Joi.Schema | null) {
  const effectiveValue = !value ? null : isJoiSchema(value) ? value.describe() : value;
  return injectFieldDecorator('output', effectiveValue);
}

function isJoiSchema(value: Joi.Description | Joi.Schema): value is Joi.Schema {
  return typeof (value as Joi.Schema).validate === 'function';
}
