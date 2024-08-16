import {
  RerunError,
  SCRIPT_ENGINE_PLUGIN,
  ScriptEngine,
  TaskDef,
  TaskHandler,
  TaskHandlerInput,
  validateParameters,
} from '@letrun/core';
import Joi from 'joi';
import { initNewIteration, validateLoopTask } from './loop-task';
import { ScriptEngineWrapper } from '@src/libs/script-engine-wrapper';

/**
 * Interface representing the parameters for the WhileTaskHandler.
 */
interface TaskParameters {
  /**
   * The JavaScript expression to evaluate.
   * @type {string}
   */
  expression: string;

  /**
   * The mode of the while loop.
   * @type {'doWhile' | 'whileDo'}
   */
  mode: 'doWhile' | 'whileDo';

  /**
   * The language of the expression.
   * Default is 'javascript'.
   */
  language?: string;
}

/**
 * Schema for validating the task parameters.
 */
const Schema = Joi.object<TaskParameters>({
  expression: Joi.string().description('The javascript expression to evaluate').required(),
  mode: Joi.string()
    .valid('doWhile', 'whileDo')
    .description('- doWhile: do tasks first, check condition after\n- whileDo: check condition first, do tasks after')
    .default('doWhile'),
  language: Joi.string().description('The language of the expression').default('javascript'),
});

/**
 * Class representing the handler for the 'while' task.
 * Implements the TaskHandler interface.
 */
export class WhileTaskHandler implements TaskHandler {
  /**
   * The name of the task handler.
   * @type {string}
   */
  name: string = 'while';

  /**
   * The description of the task handler.
   * @type {string}
   */
  description: string = 'Loops through tasks until a condition is met';

  /**
   * The parameters schema for the task handler.
   * @type {Joi.Description}
   */
  parameters: Joi.Description = Schema.describe();

  /**
   * Handles the task execution.
   * @param {TaskHandlerInput} input - The input for the task handler.
   * @returns {Promise<any>} The output of the task.
   * @throws {RerunError} To notify the engine to rerun the task for another iteration.
   */
  async handle({ task, workflow, context, session }: TaskHandlerInput): Promise<any> {
    const { expression, mode, language } = validateParameters(task.parameters, Schema);

    if (typeof task.output?.iteration !== 'number') {
      context.getLogger().debug(`Initializing while loop with expression ${expression}`);
      task.output = {
        iteration: 0,
      };
    }

    const isFirstIteration = task.output.iteration === 0;
    if (isFirstIteration && mode === 'doWhile') {
      context.getLogger().verbose(`Running iteration ${task.output.iteration} with index ${task.output.index}`);
      initNewIteration(task, session);
      task.output.iteration++;
      // notify the engine to rerun the task for another iteration
      throw new RerunError();
    }

    const canContinue = async () => {
      const scriptEngines = await context.getPluginManager().get<ScriptEngine>(SCRIPT_ENGINE_PLUGIN);
      const engineWrapper = new ScriptEngineWrapper(scriptEngines);
      const val = await engineWrapper.run(expression, {
        input: { task, workflow },
        language,
      });
      return !!val;
    };

    const shouldContinue = await canContinue();
    if (!shouldContinue) {
      context.getLogger().debug(`'While' loop finished after looping ${task.output.iteration} times`);
      return task.output;
    } else {
      context.getLogger().verbose(`Running iteration ${task.output.iteration} with index ${task.output.index}`);
      initNewIteration(task, session);
      task.output.iteration++;
      // notify the engine to rerun the task for another iteration
      throw new RerunError();
    }
  }
}

/**
 * Validates the 'while' task definition.
 * @param {TaskDef} taskDef - The task definition to validate.
 */
export function validateWhileTask(taskDef: TaskDef) {
  validateLoopTask('While')(taskDef);
}
