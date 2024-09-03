import { ObjectType } from '@src/types';
import { WorkflowTaskDefs } from './workflow-task-defs';
import { ContainerDef } from './container-def';

/**
 * Interface representing a task definition.
 * Extends the ContainerDef interface.
 */
export interface TaskDef extends ContainerDef {
  /** The title of the task definition. */
  title?: string;
  /** Optional flag to ignore errors and let other tasks continue running. */
  ignoreError?: boolean;
  /** The handler of the task. This may be the system task type or the path to the task's handler, which will handle the whole logic of this task. */
  handler: string;
  /** Optional parameters for the task, supporting interpolating values. */
  parameters?: ObjectType;
  /** Optional tasks to execute when the {@link TaskDef.handler} is 'if' and the condition is true. */
  then?: WorkflowTaskDefs;
  /** Optional tasks to execute if the {@link TaskDef.handler} is 'if' and the condition is false. */
  else?: WorkflowTaskDefs;
  /** Optional decision cases containing case-task mappings, executed if the {@link TaskDef.handler} is 'switch' and there is a matched case. */
  decisionCases?: Record<string, WorkflowTaskDefs>;
  /** Optional default case to execute if the {@link TaskDef.handler} is 'switch' and there are no matched cases. */
  defaultCase?: WorkflowTaskDefs;
  /** Optional tasks iterated if the {@link TaskDef.handler} is either 'for', 'while' or 'iterate'. */
  loopOver?: WorkflowTaskDefs;
  /** Optional tasks to execute if an error occurs and the {@link TaskDef.handler} is 'catch'. */
  catch?: WorkflowTaskDefs;
  /** Optional tasks to execute if the {@link TaskDef.handler} is 'catch' right after the {@link TaskDef.catch} block. */
  finally?: WorkflowTaskDefs;
}
