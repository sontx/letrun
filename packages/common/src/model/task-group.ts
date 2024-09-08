import { TaskHandler, TaskMetadata } from './task-handler';

/**
 * The default task group that contains tasks that have not been assigned to a group.
 */
export const UNCATEGORIZED_TASK_GROUP: TaskGroup = {
  name: 'Uncategorized',
  description: 'Tasks that have not been assigned to a group.',
};

/**
 * The system task group that contains built-in tasks.
 */
export const SYSTEM_TASK_GROUP: TaskGroup = {
  name: 'System',
  description: 'Built-in tasks',
};

/**
 * A group of tasks that are related to each other.
 */
export interface TaskGroup {
  /**
   * The name of the task group.
   */
  name: string;
  /**
   * A brief description of the task group.
   */
  description?: string;
  /**
   * The version of the task group.
   */
  version?: string;
  /**
   * The author of the task group.
   */
  author?: string;
  /**
   * The tasks that belong to this group. This map contains the name of the task as the key and the task handler as the value.
   */
  tasks?: Record<string, TaskHandler>;

  /**
   * The type of the task group.
   * - `package`: A task group that is defined in a node package.
   * - `script`: A task group that is defined in a standalone script file.
   */
  type?: 'package' | 'script';
}

/**
 * Metadata for describing a task group.
 */
export interface TaskGroupMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  type?: 'package' | 'script';
  tasks: TaskMetadata[];
}
