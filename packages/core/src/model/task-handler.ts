import { Task, Workflow } from './workflow';
import { ObjectType } from '@src/types';
import { AppContext } from './app-context';
import { ExecutionSession } from './execution-session';

/**
 * Interface representing the input for a task handler.
 */
export interface TaskHandlerInput {
  /** The workflow associated with the task. */
  workflow: Workflow;
  /** The task to be handled. */
  task: Task;
  /** The application context. */
  context: AppContext;
  /** The execution session. */
  session: ExecutionSession;
}

/**
 * Interface representing a task handler.
 * Keeps the logic stateless because it will be recalled multiple times with different task data.
 */
export interface TaskHandler {
  /** The name of the task handler. */
  name?: string;
  /** The version of the task handler. */
  version?: string;
  /** Optional description of the task handler. */
  description?: string;
  /** Optional parameters for the task handler, presenting the accepted parameters. */
  parameters?: ObjectType;
  /**
   * Handles the task.
   * @param input - The input for the task handler.
   * @returns A promise that resolves to the output of the task handler.
   */
  handle(input: TaskHandlerInput): Promise<TaskHandlerOutput>;
}

/** Type representing the output of a task handler. */
export type TaskHandlerOutput = any;
