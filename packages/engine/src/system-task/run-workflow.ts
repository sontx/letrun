import {
  Description,
  DisplayName,
  Icon,
  Keywords,
  Name,
  Output,
  Parameters,
  validateParameters,
  wrapPromiseWithAbort,
} from '@letrun/core';
import { RunnerOptions, TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';
import fs from 'fs';

interface TaskParameters extends RunnerOptions {
  /**
   * The input to pass to the workflow.
   * @type {any}
   */
  input?: any;
}

const Schema = Joi.object<TaskParameters>({
  file: Joi.string().description('The file path to the workflow to run'),
  workflow: Joi.any().description(
    'Either the workflow object, workflow definition object or their text content to run',
  ),
  input: Joi.any().description('The input to pass to the workflow'),
}).xor('file', 'workflow');

const OutputSchema = Joi.any().description('The output of the sub-workflow');

@Name('run-workflow')
@DisplayName('Run Workflow')
@Keywords('workflow', 'sub-workflow')
@Description('Runs another workflow within the current workflow')
@Icon('https://raw.githubusercontent.com/sontx/letrun/main/icons/workflow.svg')
@Parameters(Schema)
@Output(OutputSchema)
export class RunWorkflowTaskHandler implements TaskHandler {
  async handle({ task, session, context }: TaskHandlerInput): Promise<any> {
    const { workflow, input, file } = validateParameters(task.parameters, Schema);
    let workflowToRun = workflow ? (typeof workflow === 'string' ? JSON.parse(workflow) : workflow) : undefined;
    if (file) {
      const fileContent = await fs.promises.readFile(file, 'utf8');
      workflowToRun = JSON.parse(fileContent);
    }

    context.getLogger().info(`Running workflow: ${workflowToRun?.name}`);
    const ranWorkflow = await wrapPromiseWithAbort(session.runner.run(workflowToRun, input), session.signal);
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
