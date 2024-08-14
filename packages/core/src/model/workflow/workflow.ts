import { ObjectType } from '@src/types';
import { Container } from './container';

/**
 * Interface representing a workflow, generated based on the {@link WorkflowDef} automatically.
 * Holds the runtime information of the workflow.
 * Extends the Container interface.
 */
export interface Workflow extends Container {
  /** The status of the workflow. */
  status: WorkflowStatus;
  /** Optional variables associated with the workflow. All tasks inside this workflow can access and change variables whenever they want. */
  variables?: ObjectType;
  /** Optional input data for the workflow. */
  input?: ObjectType;
}

/** Type representing the possible statuses of a workflow. */
export type WorkflowStatus = 'open' | 'executing' | 'error' | 'completed';
