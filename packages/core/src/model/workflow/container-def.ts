import { WorkflowTaskDefs } from './workflow-task-defs';
import { RetryConfig } from '../retry-config';

/**
 * Interface representing a container definition.
 */
export interface ContainerDef extends RetryConfig {
  /** Name of the container definition, useful for distinguishing and referencing for interpolating values
   * from either the {@link ContainerDef.input} or {@link TaskDef.parameters}.
   * */
  name: string;
  /** Optional task definitions associated with the container definition, executed before this task is completed. */
  tasks?: WorkflowTaskDefs;

  /** Additional properties for the container definition. */
  [key: string]: any;
}
