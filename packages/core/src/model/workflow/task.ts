import { ObjectType } from '@src/types';
import { WorkflowTasks } from './workflow-tasks';
import { Container } from './container';
import { TaskDef } from './task-def';
import { Retryable } from '../retryable';

/**
 * Interface representing a task, generated based on the {@link TaskDef} automatically.
 * Holds the runtime information of the task.
 * Extends the Container interface.
 */
export interface Task extends Container, Retryable {
  /** Runtime name of the task. It may be the same as the {@link TaskDef.name} in most cases.
   * In looping cases, it may depend on the iteration.
   * */
  runtimeName: string;
  /** The status of the task. */
  status: TaskStatus;
  /** Optional time when the task was opened and ready for execution. */
  timeOpened?: number;
  /** Optional total duration of the task from {@link Task.timeOpened} to {@link Task.timeCompleted}. */
  totalDuration?: number;
  /** Optional flag indicating if the task is in a blocking state.
   * Other sibling tasks will wait for this task to be done before they can be queued for execution.
   * */
  blocking?: boolean;
  /** Optional parameters for the task, calculated after being interpolated by the {@link TaskDef.parameters}. */
  parameters?: ObjectType;
  /** The task definition associated with the task. */
  taskDef: TaskDef;
  /** Optional tasks to execute when the {@link TaskDef.handler} is 'if' and the condition is true. */
  then?: WorkflowTasks;
  /** Optional tasks to execute if the {@link TaskDef.handler} is 'if' and the condition is false. */
  else?: WorkflowTasks;
  /** Optional decision cases containing case-task mappings,
   * executed if the {@link TaskDef.handler} is 'switch' and there is a matched case.
   * */
  decisionCases?: Record<string, WorkflowTasks>;
  /** Optional default case to execute if the {@link TaskDef.handler} is 'switch' and there are no matched cases. */
  defaultCase?: WorkflowTasks;
  /** Optional tasks executed if the {@link TaskDef.handler} is either 'for' or 'while' when looped over the {@link TaskDef.loopOver}. */
  loopOver?: Task[];
  /** Optional tasks to execute if an error occurs and the {@link TaskDef.handler} is 'catch'. */
  catch?: WorkflowTasks;
  /** Optional tasks to execute if the {@link TaskDef.handler} is 'catch' right after the {@link TaskDef.catch} block. */
  finally?: WorkflowTasks;
}

/** Type representing the possible statuses of a task. */
export type TaskStatus = 'open' | 'paused' | 'waiting' | 'executing' | 'error' | 'completed' | 'cancelled';
