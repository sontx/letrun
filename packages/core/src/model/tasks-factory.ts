import { WorkflowTaskDefs, WorkflowTasks } from './workflow';

/**
 * Interface representing a tasks factory.
 */
export interface TasksFactory {
  /**
   * Creates tasks from task definitions.
   * @param taskDefs - The task definitions.
   * @param parentId - Optional parent ID for the tasks.
   * @returns The created tasks.
   */
  createTasks(taskDefs: WorkflowTaskDefs, parentId?: string): WorkflowTasks;
}
