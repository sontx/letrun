import Joi from 'joi';

/**
 * Schema for validating a task definition.
 * - `title`: Optional string representing the title of the task.
 * - `ignoreError`: Optional boolean indicating whether to ignore errors.
 * - `handler`: Required string representing the handler for the task.
 * - `parameters`: Optional object containing parameters for the task.
 */
export const TaskDefSchema = Joi.object({
  title: Joi.string(),
  ignoreError: Joi.boolean(),
  handler: Joi.string().required(),
  parameters: Joi.object(),
}).unknown(true);

/**
 * Schema for validating a task definition with a required name.
 * Extends `TaskDefSchema` by adding a required `name` field.
 */
const RequiredNameTaskDefSchema = TaskDefSchema.keys({
  name: Joi.string().required(),
});

/**
 * Schema for validating a container definition.
 * - `name`: Required string representing the name of the container.
 * - `tasks`: Either an object with task definitions or an array of task definitions with required names.
 */
export const ContainerDefSchema = Joi.object({
  name: Joi.string().required(),
  tasks: Joi.alternatives().try(Joi.object().pattern(/./, TaskDefSchema), Joi.array().items(RequiredNameTaskDefSchema)),
}).unknown(true);
