import { injectFieldDecorator } from '@src/utils';
import { TaskHandler } from '@letrun/common';
import type Joi from 'joi';

/**
 * A decorator that injects the name field to a {@link TaskHandler}.
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
 * A decorator that injects the version field to a {@link TaskHandler}.
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
 * A decorator that injects the description field to a {@link TaskHandler}.
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
 * A decorator that injects the parameters field to a {@link TaskHandler}.
 * @param value - task handler parameters.
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
export function Parameters(value: Joi.Description | Joi.Schema) {
  return injectFieldDecorator('parameters', isJoiSchema(value) ? value.describe() : value);
}

function isJoiSchema(value: Joi.Description | Joi.Schema): value is Joi.Schema {
  return typeof (value as Joi.Schema).validate === 'function';
}
