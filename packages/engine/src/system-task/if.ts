import {
  countTasks,
  Description,
  Icon,
  isWorkflowTaskDefsEmpty,
  Name,
  Output,
  Parameters,
  validateParameters,
} from '@letrun/core';
import { InvalidParameterError, TaskDef, TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';

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

const OutputSchema = Joi.boolean().description('The result of the expression');

@Name('if')
@Description('Executes tasks based on conditions')
@Icon('https://raw.githubusercontent.com/sontx/letrun/main/icons/if.svg')
@Parameters(Schema)
@Output(OutputSchema)
export class IfTaskHandler implements TaskHandler {
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
