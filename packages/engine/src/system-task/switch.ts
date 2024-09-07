import {
  countTasks,
  Description,
  isWorkflowTaskDefsEmpty,
  Name,
  Output,
  Parameters,
  SCRIPT_ENGINE_PLUGIN,
  ScriptEngine,
  validateParameters,
} from '@letrun/core';
import { IllegalStateError, InvalidParameterError, TaskDef, TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';
import { ScriptEngineWrapper } from '@src/libs/script-engine-wrapper';

interface TaskParameters {
  /**
   * The expression to evaluate.
   * @type {string}
   */
  expression: string;

  /**
   * The language of the expression.
   * Default is 'javascript'.
   */
  language?: string;
}

const Schema = Joi.object<TaskParameters>({
  expression: Joi.string().description('The result of this expression will be matched with the target case').required(),
  language: Joi.string().description(
    'The language of the expression, if not provided, the expression will be treated as other parameter',
  ),
});

const OutputSchema = Joi.string().description('The target case to switch to');

@Name('switch')
@Description('Chooses tasks based on input values')
@Parameters(Schema)
@Output(OutputSchema)
export class SwitchTaskHandler implements TaskHandler {
  async handle(input: TaskHandlerInput): Promise<string> {
    const { task, context, session } = input;
    const targetCase = await this.evaluateDecisionCase(input);
    const decisionCases = task.decisionCases || {};
    if (decisionCases[targetCase]) {
      session.setTasks(task, decisionCases[targetCase]);
      context.getLogger().debug(`Switching to case: ${targetCase}`);
    } else if (countTasks(task.defaultCase) > 0) {
      session.setTasks(task, task.defaultCase!);
      context.getLogger().debug(`No case found for target ${targetCase}, switching to default case`);
    } else {
      if (targetCase) {
        throw new IllegalStateError(`No case found for target ${targetCase}, the default case is missing`);
      } else {
        throw new IllegalStateError(`No case found for target, the default case is missing`);
      }
    }

    return targetCase;
  }

  private async evaluateDecisionCase({ task, context, workflow }: TaskHandlerInput): Promise<string> {
    const { expression, language } = validateParameters(task.parameters, Schema);
    if (!language) {
      return expression?.trim();
    }

    const scriptEngines = await context.getPluginManager().get<ScriptEngine>(SCRIPT_ENGINE_PLUGIN);
    const engineWrapper = new ScriptEngineWrapper(scriptEngines);
    return await engineWrapper.run(expression, { language, input: { task, workflow } });
  }
}

/**
 * Validates the switch task definition.
 * @param {TaskDef} taskDef - The task definition to validate.
 * @throws {InvalidParameterError} If the task definition is invalid.
 */
export function validateSwitchTask(taskDef: TaskDef) {
  if (!isWorkflowTaskDefsEmpty(taskDef.tasks)) {
    throw new InvalidParameterError(
      `'Switch' task ${taskDef.name} can't have a tasks property, use 'decisionCases' and 'defaultCase' properties for defining tasks instead`,
    );
  }

  if (isWorkflowTaskDefsEmpty(taskDef.defaultCase) && Object.keys(taskDef.decisionCases ?? {}).length === 0) {
    throw new InvalidParameterError(
      `'Switch' task ${taskDef.name} must have either a 'decisionCases' or 'defaultCase' property`,
    );
  }
}
