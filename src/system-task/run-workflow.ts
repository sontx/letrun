import { RunnerOptions, TaskHandler, TaskHandlerInput, validateParameters } from '@letrun/core';
import Joi from 'joi';
import fs from 'fs';

/**
 * Interface representing the parameters for the RunWorkflowTaskHandler.
 * Extends RunnerOptions.
 */
interface TaskParameters extends RunnerOptions {
  /**
   * The input to pass to the workflow.
   * @type {any}
   */
  input?: any;
}

/**
 * Schema for validating the task parameters.
 */
const Schema = Joi.object<TaskParameters>({
  file: Joi.string().description('The file path to the workflow to run'),
  workflow: Joi.any().description(
    'Either the workflow object, workflow definition object or their text content to run',
  ),
  input: Joi.any().description('The input to pass to the workflow'),
}).xor('file', 'workflow');

/**
 * Class representing the handler for the 'run-workflow' task.
 * Implements the TaskHandler interface.
 */
export class RunWorkflowTaskHandler implements TaskHandler {
  /**
   * The name of the task handler.
   * @type {string}
   */
  name: string = 'run-workflow';

  /**
   * The description of the task handler.
   * @type {string}
   */
  description: string = 'Runs another workflow within the current workflow';

  /**
   * The parameters schema for the task handler.
   * @type {Joi.Description}
   */
  parameters: Joi.Description = Schema.describe();

  /**
   * Handles the task execution.
   * @param {TaskHandlerInput} input - The input for the task handler.
   * @returns {Promise<any>} The output of the task.
   * @throws {Error} If the workflow fails to run or completes with an error.
   */
  async handle({ task, session, context }: TaskHandlerInput): Promise<any> {
    const { workflow, input, file } = validateParameters(task.parameters, Schema);
    let workflowToRun = workflow ? (typeof workflow === 'string' ? JSON.parse(workflow) : workflow) : undefined;
    if (file) {
      const fileContent = await fs.promises.readFile(file, 'utf8');
      workflowToRun = JSON.parse(fileContent);
    }

    context.getLogger().info(`Running workflow: ${workflowToRun?.name}`);
    const ranWorkflow = await session.runner.run(workflowToRun, input);
    if (ranWorkflow) {
      if (ranWorkflow.status === 'completed') {
        context.getLogger().info(`Workflow ${ranWorkflow.name} completed successfully`);
        return ranWorkflow.output;
      }

      const msg = `Workflow ${ranWorkflow.name} failed with status: ${ranWorkflow.status}`;
      context.getLogger().error(msg);
      throw new Error(ranWorkflow.errorMessage ?? msg);
    }

    context.getLogger().error('Failed to run workflow');
    throw new Error('Failed to run workflow');
  }
}
