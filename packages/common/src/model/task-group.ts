import { TaskHandler, TaskMetadata } from './task-handler';

/**
 * The default task group that contains tasks that have not been assigned to a group.
 */
export const UNCATEGORIZED_TASK_GROUP: TaskGroup = {
  name: 'uncategorized',
  displayName: 'Uncategorized',
  description: 'Tasks that have not been assigned to a group.',
};

/**
 * The system task group that contains built-in tasks.
 */
export const SYSTEM_TASK_GROUP: TaskGroup = {
  name: 'system',
  displayName: 'System',
  description: 'Built-in tasks that are provided by the system.',
  keywords: ['built-in'],
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
   * The display name of the task group.
   * If not provided, the name will be used as the display name.
   * This name is used for displaying the task group in the UI such as the Studio.
   * You can define group's display name in the letrun.displayName field of package.json.
   *
   * @example
   * ```json
   * {
   *   "letrun": {
   *     "displayName": "My Task Group"
   *   }
   *   ...
   * }
   * ```
   */
  displayName?: string;
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
   * Optional keywords to match against when filtering.
   * You can define group's keywords in the keywords field of package.json.
   *
   * @example
   * ```json
   * {
   *   "keywords": ["awesome", "cool"]
   *   ...
   * }
   * ```
   */
  keywords?: string[];
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
  displayName?: string;
  description?: string;
  version?: string;
  author?: string;
  icon?: string;
  keywords?: string[];
  type?: 'package' | 'script';
  tasks: TaskMetadata[];
}
