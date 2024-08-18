import {
  countTasks,
  InvalidParameterError,
  isWorkflowTaskDefsEmpty,
  TaskDef,
  TaskHandler,
  TaskHandlerInput,
  validateParameters,
} from '@letrun/core';
import Joi from 'joi';

/**
 * Interface representing the parameters for the IfTaskHandler.
 */
interface TaskParameters {
  /**
   * The left operand of the expression.
   * @type {any}
   */
  left: any;

  /**
   * The operator to use in the expression.
   * @type {string}
   */
  operator:
    | '=='
    | '='
    | '!='
    | '<>'
    | '>'
    | '<'
    | '>='
    | '<='
    | 'in'
    | 'not in'
    | 'contains'
    | 'not contains'
    | 'matches regex'
    | 'is empty'
    | 'is not empty'
    | 'is defined'
    | 'is not defined';

  /**
   * The right operand of the expression.
   * @type {any}
   */
  right: any;
}

/**
 * Schema for validating the task parameters.
 */
const Schema = Joi.object<TaskParameters>({
  left: Joi.any().required(),
  operator: Joi.string()
    .allow(
      '==',
      '=',
      '!=',
      '<>',
      '>',
      '<',
      '>=',
      '<=',
      'in',
      'not in',
      'contains',
      'not contains',
      'matches regex',
      'is empty',
      'is not empty',
      'is defined',
      'is not defined',
      'truly',
      'is truly',
      'falsy',
      'is falsy',
    )
    .required(),
  right: Joi.any(),
});

/**
 * Class representing the handler for the 'if' task.
 * Implements the TaskHandler interface.
 */
export class IfTaskHandler implements TaskHandler {
  /**
   * The name of the task handler.
   * @type {string}
   */
  name: string = 'if';

  /**
   * The description of the task handler.
   * @type {string}
   */
  description: string = 'Executes tasks based on conditions';

  /**
   * The parameters schema for the task handler.
   * @type {Joi.Description}
   */
  parameters: Joi.Description = Schema.describe();

  /**
   * Handles the task execution.
   * @param {TaskHandlerInput} input - The input for the task handler.
   * @returns {Promise<boolean>} The output of the task.
   */
  async handle({ task, context, session }: TaskHandlerInput): Promise<boolean> {
    const value = validateParameters(task.parameters, Schema);
    const matched = this.isMatched(value);
    if (matched) {
      context.getLogger().debug(`Matched: ${value.left} ${value.operator} ${value.right}`);
      context.getLogger().debug(`Executing then tasks: ${countTasks(task.then, false)}`);
      session.setTasks(task, task.then ?? {});
    } else {
      context.getLogger().debug(`Not matched: ${value.left} ${value.operator} ${value.right}`);
      context.getLogger().debug(`Executing else tasks: ${countTasks(task.else, false)}`);
      session.setTasks(task, task.else ?? {});
    }
    return matched;
  }

  /**
   * Checks if the expression is matched.
   * @private
   * @param {TaskParameters} parameters - The task parameters.
   * @returns {boolean} True if the expression is matched, false otherwise.
   */
  private isMatched(parameters: TaskParameters): boolean {
    const { left, right, operator } = parameters;
    switch (operator.toLowerCase()) {
      case '==':
        return left === right;
      case '=':
        return left == right;
      case '!=':
      case '<>':
        return left !== right;
      case '>':
        return left > right;
      case '<':
        return left < right;
      case '>=':
        return left >= right;
      case '<=':
        return left <= right;
      case 'in':
        return this.isIn(right, left);
      case 'not in':
        return !this.isIn(right, left);
      case 'contains':
        return right?.includes(left);
      case 'not contains':
        return !right?.includes(left);
      case 'matches regex':
        return new RegExp(right).test(left);
      case 'is empty':
        return this.isEmpty(left);
      case 'is not empty':
        return !this.isEmpty(left);
      case 'is defined':
        return left !== undefined && left !== null;
      case 'is not defined':
        return left === undefined || left === null;
      case 'is truly':
      case 'truly':
        return !!left;
      case 'is falsy':
      case 'falsy':
        return !left;
      default:
        throw new InvalidParameterError(`Invalid operator: ${operator}`);
    }
  }

  private isIn(right: any, left: any): boolean {
    return typeof right === 'string' || Array.isArray(right)
      ? right.includes(left)
      : typeof right === 'object'
        ? Object.keys(right).includes(left)
        : false;
  }

  private isEmpty(value: any): boolean {
    return typeof value === 'string'
      ? value === ''
      : Array.isArray(value)
        ? value.length === 0
        : typeof value === 'object'
          ? Object.keys(value).length === 0
          : false;
  }
}

/**
 * Validates the 'if' task definition.
 * @param {TaskDef} taskDef - The task definition to validate.
 * @throws {InvalidParameterError} If the task definition is invalid.
 */
export function validateIfTask(taskDef: TaskDef) {
  if (!isWorkflowTaskDefsEmpty(taskDef.tasks)) {
    throw new InvalidParameterError(
      `'If' task ${taskDef.name} can't have a tasks property, use 'then' and 'else' properties for defining tasks instead`,
    );
  }

  if (isWorkflowTaskDefsEmpty(taskDef.then) && isWorkflowTaskDefsEmpty(taskDef.else)) {
    throw new InvalidParameterError(`'If' task ${taskDef.name} must have either a 'then' or 'else' property`);
  }
}