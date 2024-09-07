import {
  Description,
  Name,
  Output,
  Parameters,
  SCRIPT_ENGINE_PLUGIN,
  ScriptEngine,
  validateParameters,
} from '@letrun/core';
import { RerunError, TaskDef, TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';
import { initNewIteration, validateLoopTask } from './loop-task';
import { ScriptEngineWrapper } from '@src/libs/script-engine-wrapper';

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

const Schema = Joi.object<TaskParameters>({
  expression: Joi.string().description('The javascript expression to evaluate').required(),
  mode: Joi.string()
    .valid('doWhile', 'whileDo')
    .description('- doWhile: do tasks first, check condition after\n- whileDo: check condition first, do tasks after')
    .default('doWhile'),
  language: Joi.string().description('The language of the expression').default('javascript'),
});

const OutputSchema = Joi.object({
  iteration: Joi.number().description('The current iteration of the loop, starting from 0'),
});

@Name('while')
@Description('Loops through tasks until a condition is met')
@Parameters(Schema)
@Output(OutputSchema)
export class WhileTaskHandler implements TaskHandler {
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
      context.getLogger().verbose(`Running iteration ${task.output.iteration}`);
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
      context.getLogger().verbose(`Running iteration ${task.output.iteration}`);
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
