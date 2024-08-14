import { Task, Workflow, WorkflowTasks } from './workflow';
import { TasksFactory } from './tasks-factory';
import { Runner } from './runner';
import { TaskHandler } from './task-handler';

/**
 * Interface representing an execution session. Each time a workflow is executed, a new session is created.
 */
export interface ExecutionSession {
  /** The workflow associated with the session. */
  readonly workflow: Workflow;
  /** The tasks factory associated with the session. */
  readonly tasksFactory: TasksFactory;
  /** The runner associated with the session. */
  readonly runner: Runner;
  /**
   * A record of system tasks, where the key is the task name and the value is the task handler.
   */
  readonly systemTasks: Record<string, TaskHandler>;

  /**
   * Sets tasks for a parent task.
   * @param parentTask - The parent task.
   * @param tasks - The tasks to set.
   */
  setTasks(parentTask: Task, tasks: WorkflowTasks): void;

  /**
   * Clears tasks for a parent task.
   * @param parentTask - The parent task.
   */
  clearTasks(parentTask: Task): void;

  /**
   * Gets the parent task of a task.
   * @param task - The task.
   * @param checkParentFn - Optional function to check if the parent task matches the requirement.
   * @returns The parent task or undefined.
   */
  getParentTask(task: Task, checkParentFn?: (parentTask: Task) => boolean): Task | undefined;

  /**
   * Resolves a parameter value by interpolating against the workflow.
   * @template T - The type of the parameter value.
   * @param parameterValue - The parameter value.
   * @returns A promise that resolves to the parameter value.
   */
  resolveParameter<T = any>(parameterValue: T): Promise<T>;
}
