import {
  countTasks,
  Description,
  getTasksByStatus,
  Icon,
  isWorkflowTaskDefsEmpty,
  Name,
  Output,
  Parameters,
  SCRIPT_ENGINE_PLUGIN,
  ScriptEngine,
  validateParameters,
} from '@letrun/core';
import { InvalidParameterError, RerunError, Task, TaskDef, TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';
import { ScriptEngineWrapper } from '@src/libs/script-engine-wrapper';

interface TaskParameters {
  /**
   * The error name to match against the caught error if the catch is executed.
   * @type {string}
   */
  errorName?: string;

  /**
   * The script expression to evaluate to determine if the catch should be executed.
   * @type {string}
   */
  expression?: string;

  /**
   * The language of the expression.
   * Default is 'javascript'.
   */
  language?: string;
}

const Schema = Joi.object<TaskParameters>({
  errorName: Joi.string().description('The error name to match against the caught error if the catch is executed'),
  expression: Joi.string().description(
    'The script expression to evaluate to determine if the catch should be executed',
  ),
  language: Joi.string().description('The language of the expression').default('javascript'),
}).oxor('errorName', 'expression');

const OutputSchema = Joi.object({
  handledBlocks: Joi.array().items(Joi.string().allow('catch', 'finally')).description('The handled blocks'),
  error: Joi.object().description('The error that was caught'),
});

@Name('catch')
@Description('Handles errors during task execution')
@Icon('https://raw.githubusercontent.com/sontx/letrun/main/icons/catch.svg')
@Parameters(Schema)
@Output(OutputSchema)
export class CatchTaskHandler implements TaskHandler {
  async handle(input: TaskHandlerInput): Promise<any> {
    const { task } = input;

    const errorTasks = getTasksByStatus(task, 'error', true);
    const errorTaskArray = Object.keys(errorTasks).map((key) => errorTasks[key]!);
    const hasErrors = errorTaskArray.length > 0;
    const alreadyRanCatch = task.output.handledBlocks?.includes('catch');
    const alreadyRanFinally = task.output.handledBlocks?.includes('finally');

    const throwDelayErrorIfAny = () => {
      if (task.delayError) {
        const delayError = task.delayError;
        delete task.delayError;
        throw delayError;
      }
    };

    // if there are errors that means the errors may be thrown from either the execution block, catch block or finally block
    const isErrorFromExecutionBlock = hasErrors && !alreadyRanCatch && !alreadyRanFinally;
    const isErrorFromCatchBlock = hasErrors && alreadyRanCatch && !alreadyRanFinally;
    const isErrorFromFinallyBlock = hasErrors && alreadyRanFinally;

    // the errors are thrown from the execution block, forward the error to the catch block
    if (isErrorFromExecutionBlock) {
      await this.handleCatchBlock(errorTaskArray, input);
      // there is nothing to do with the catch block, execute the finally block
      this.handleFinallyBlock(input);
      // there is nothing to do with the finally block, throw the error if there is any
      throwDelayErrorIfAny();
      return task.output;
    }

    // the errors are thrown from the catch block, forward the error to the finally block
    if (isErrorFromCatchBlock) {
      // we expect this error to be thrown after the finally block is executed
      task.delayError = errorTaskArray[0]?.error;
      task.output.error = errorTaskArray[0]?.error;
      this.handleFinallyBlock(input);
      // there is nothing to do with the finally block, throw the error if there is any
      delete task.delayError;
      throw errorTaskArray[0]?.error;
    }

    // the errors are thrown from the finally block, throw the error to the parent task
    if (isErrorFromFinallyBlock) {
      throw errorTaskArray[0]?.error;
    }

    // if there are no errors that means either the execution block, catch block or finally block was successful
    const isSuccessfulExecution = !hasErrors && !alreadyRanCatch && !alreadyRanFinally;
    const isSuccessfulCatch = !hasErrors && alreadyRanCatch && !alreadyRanFinally;
    const isSuccessfulFinally = !hasErrors && alreadyRanFinally;

    // the execution block was successful, execute the finally block
    if (isSuccessfulExecution || isSuccessfulCatch) {
      this.handleFinallyBlock(input);
      return task.output;
    }

    // the finally block was successful, throw the error if there is any
    if (isSuccessfulFinally) {
      throwDelayErrorIfAny();
      return task.output;
    }
  }

  private async handleCatchBlock(errorTaskArray: Task[], input: TaskHandlerInput): Promise<void | never> {
    const { task, context, session } = input;
    const { errorName, expression, language } = validateParameters(task.parameters, Schema);

    const errors = errorTaskArray.map((errorTask) => errorTask.error);
    const firstError = errorTaskArray[0]!.error;

    task.output = {
      handledBlocks: ['catch'],
      error: firstError,
    };

    if (errorName && !this.matchesErrorName(errorName, errors)) {
      context.getLogger().debug(`Error name ${errorName} does not match any of the caught errors`);
      // save the error to throw after the finally block is executed
      task.delayError = firstError;
      return;
    }

    if (expression && !(await this.matchesExpression(expression, language, errors, input))) {
      context.getLogger().debug(`Expression ${expression} does not match any of the caught errors`);
      // save the error to throw after the finally block is executed
      task.delayError = firstError;
      return;
    }

    let shortMessage: string;
    if (errorTaskArray.length === 1) {
      shortMessage = errorTaskArray[0]?.error?.message;
    } else {
      shortMessage = errorTaskArray.map((errorTask) => errorTask.error?.name).join(', ');
    }
    context.getLogger().debug(`Executing catch block for error: ${shortMessage}`);

    if (countTasks(task.catch) > 0) {
      task.errorTasks = task.tasks;
      session.setTasks(task, task.catch!);
      // notify the engine to rerun the updated task children above
      throw new RerunError();
    }
  }

  private handleFinallyBlock({ task, context, session }: TaskHandlerInput): void | never {
    if (countTasks(task.finally) > 0) {
      if (!task.output) {
        task.output = {};
      }
      if (!task.output?.handledBlocks) {
        task.output.handledBlocks = [];
      }
      task.output.handledBlocks.push('finally');

      context.getLogger().debug(`Executing finally block`);
      session.setTasks(task, task.finally!);
      // notify the engine to rerun the updated task children above
      throw new RerunError();
    }
  }

  /**
   * Checks if the error name matches any of the caught errors.
   * @private
   * @param {string} errorName - The error name to match.
   * @param {Error[]} errors - The array of caught errors.
   * @returns {boolean} True if the error name matches, false otherwise.
   */
  private matchesErrorName(errorName: string, errors: Error[]): boolean {
    return errors.some((e) => e.name === errorName);
  }

  private async matchesExpression(
    expression: string,
    language: string | undefined,
    errors: Error[],
    { context, task, workflow }: TaskHandlerInput,
  ): Promise<boolean> {
    const scriptEngines = await context.getPluginManager().get<ScriptEngine>(SCRIPT_ENGINE_PLUGIN);
    const engineWrapper = new ScriptEngineWrapper(scriptEngines);

    for (const error of errors) {
      const val = await engineWrapper.run(expression, {
        language,
        input: { task, workflow, error },
      });
      if (val) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Validates the catch task definition.
 * @param {TaskDef} taskDef - The task definition to validate.
 * @throws {InvalidParameterError} If the task definition is invalid.
 */
export function validateCatchTask(taskDef: TaskDef) {
  if (isWorkflowTaskDefsEmpty(taskDef.tasks)) {
    throw new InvalidParameterError(`'Catch' task ${taskDef.name} must have a 'tasks' property with at least one task`);
  }

  if (isWorkflowTaskDefsEmpty(taskDef.catch) && isWorkflowTaskDefsEmpty(taskDef.finally)) {
    throw new InvalidParameterError(`'Catch' task ${taskDef.name} must have either a 'catch' or 'finally' property`);
  }
}
