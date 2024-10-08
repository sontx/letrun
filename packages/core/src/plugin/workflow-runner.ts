import { ExecutablePlugin, Workflow, ExecutionSession } from '@letrun/common';

export const WORKFLOW_RUNNER_PLUGIN = 'workflow-runner';

/**
 * Interface representing the input for a Workflow Runner.
 */
export interface WorkflowRunnerInput {
  /**
   * The workflow to be executed.
   */
  workflow: Workflow;

  /**
   * The execution session for the workflow.
   */
  session: ExecutionSession;
}

/**
 * Interface representing a Workflow Runner plugin.
 */
export interface WorkflowRunner extends ExecutablePlugin<WorkflowRunnerInput> {
  readonly type: typeof WORKFLOW_RUNNER_PLUGIN;
}
