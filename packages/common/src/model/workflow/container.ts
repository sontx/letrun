import { WorkflowTasks } from './workflow-tasks';

/**
 * Interface representing a container.
 */
export interface Container {
  /** The unique identifier of the container. */
  id: string;
  /** Optional output data for the container. */
  output?: any;
  /** Optional tasks to be executed. */
  tasks?: WorkflowTasks;
  /** Optional time when the container started. */
  timeStarted?: number;
  /** Optional time when the container completed. */
  timeCompleted?: number;
  /** Optional duration of the handler execution. */
  handlerDuration?: number;
  /** Optional error message if an error occurred. */
  errorMessage?: string;

  /** Additional properties for the container. */
  [key: string]: any;
}
