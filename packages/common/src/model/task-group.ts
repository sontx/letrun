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
   * This name should be unique across all task groups.
   * You can define group's name in the name field of package.json.
   *
   * @example
   * ```json
   * {
   *   "name": "my-task-group"
   *   ...
   * }
   * ```
   */
  name: string;
  /**
   * A brief description of the task group.
   * This description will be shown in the help output.
   * You can define group's description in the description field of package.json.
   *
   * @example
   * ```json
   * {
   *   "description": "This is an awesome task group"
   *   ...
   * }
   * ```
   */
  description?: string;
  /**
   * The version of the task group.
   * You can define group's version in the version field of package.json.
   *
   * @example
   * ```json
   * {
   *    "version": "1.0.0"
   *    ...
   * }
   * ```
   */
  version?: string;
  /**
   * The author of the task group.
   * You can define group's author in the author field of package.json.
   *
   * @example
   * ```json
   * {
   *   "author": "John Doe"
   *   ...
   * }
   * ```
   */
  author?: string;
  /**
   * The icon url of the task group.
   * You can define group's icon in the letrun.icon field of package.json.
   *
   * @example
   * ```json
   * {
   *   "letrun": {
   *     "icon": "https://example.com/icon.png"
   *   }
   *   ...
   * }
   * ```
   */
  icon?: string;
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
  icon?: string;
  type?: 'package' | 'script';
  tasks: TaskMetadata[];
}
