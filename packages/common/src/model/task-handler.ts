import { Task, Workflow } from './workflow';
import { AppContext } from './app-context';
import { ExecutionSession } from './execution-session';
import type Joi from 'joi';

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
export interface TaskHandler<T = any> {
  /**
   * The name of the task handler.
   * This name should be unique across all task handlers of the same {@link TaskGroup}.
   */
  name?: string;
  /**
   * The display name of the task handler.
   * If not provided, the name will be used as the display name.
   * This name is used for displaying the task handler in the UI such as the Studio.
   */
  displayName?: string;
  /** The version of the task handler. */
  version?: string;
  /** Optional description of the task handler. */
  description?: string;
  /**
   * The icon url of the task handler.
   */
  icon?: string;
  /**
   * Optional keywords to match against when filtering.
   */
  keywords?: string[];
  /**
   *  An object that describes the input parameters of the task for showing help.
   *  If the task does not require any input, set this to null.
   */
  parameters?: Joi.Description | null;
  /**
   * An object that describes the output of the task for showing help.
   * If the task does not return anything, set this to null.
   */
  output?: Joi.Description | null;

  /**
   * Handles the task.
   * @param input - The input for the task handler.
   * @returns A promise that resolves to the output of the task handler.
   */
  handle(input: TaskHandlerInput): Promise<T> | T;
}

export interface TaskHandlerConstructor {
  new (): TaskHandler;
}

/**
 * Metadata for describing a task.
 */
export interface TaskMetadata {
  name: string;
  displayName?: string;
  version?: string;
  description?: string;
  keywords?: string[];
  icon?: string;
  parameters?: Joi.Description | null;
  output?: Joi.Description | null;
}
