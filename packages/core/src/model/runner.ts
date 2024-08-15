import { Workflow, WorkflowDef } from './workflow';
import { AppContext } from './app-context';

/**
 * Interface representing the options for a runner.
 */
export interface RunnerOptions {
  /** Optional file for the runner. */
  file?: string;
  /** Optional workflow for the runner. */
  workflow?: string | WorkflowDef | Workflow;
}

/**
 * Interface representing a runner, the main entry point for running a workflow.
 */
export interface Runner {
  /**
   * Loads the runner.
   * @param context - Optional application context.
   * @returns A promise that resolves when the runner is loaded.
   */
  load(context?: AppContext): Promise<void>;
  /**
   * Unloads the runner.
   * @returns A promise that resolves when the runner is unloaded.
   */
  unload(): Promise<void>;
  /**
   * Runs a workflow.
   * @param workflowDef - The workflow definition or workflow to run.
   * @param input - Optional input data for the workflow.
   * @returns A promise that resolves to the workflow.
   */
  run(workflowDef: WorkflowDef | Workflow, input?: any): Promise<Workflow | undefined>;
}
