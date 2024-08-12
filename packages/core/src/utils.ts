import { Container, Plugin, Task, TaskDef, TaskStatus, WorkflowTaskDefs, WorkflowTasks } from './model';
import path from 'node:path';
import { ObjectType } from './types';
import { InvalidParameterError } from './error';
import type Joi from 'joi';

/**
 * Imports the default export from a module.
 * @param {string} filePath - The path to the module file.
 * @returns {Promise<any>} A promise that resolves to the default export of the module.
 */
export async function importDefault(filePath: string): Promise<any> {
  const effectivePath = isRelativePath(filePath) ? path.resolve(getEntryPointDir(), filePath) : filePath;
  const obj = await import(`file://${effectivePath}`);
  return filePath.endsWith('.cjs') ? obj.default.default : obj.default;
}

/**
 * Checks if a path is relative.
 * @param {string} path - The path to check.
 * @returns {boolean} True if the path is relative, false otherwise.
 */
export function isRelativePath(path: string): boolean {
  return path.startsWith('./') || path.startsWith('../');
}

/**
 * Gets the current directory of the entry point.
 * @returns {string} The current directory.
 */
export function getEntryPointDir(): string {
  const entryPoint = process.argv[1]!;
  return path.dirname(entryPoint);
}

/**
 * Delays execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
export function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Loads configuration into a plugin.
 * @param {ObjectType} config - The configuration object.
 * @param {Plugin} plugin - The plugin to load the configuration into.
 */
export function loadConfigToPlugin(config: ObjectType, plugin: Plugin) {
  const pluginConfig = config?.[plugin.type]?.[plugin.name] ?? {};
  for (const key in pluginConfig) {
    plugin[key] = pluginConfig[key];
  }
}

/**
 * Validates parameters against a Joi schema.
 * @template T
 * @param {any} parameters - The parameters to validate.
 * @param {Joi.ObjectSchema<T>} schema - The Joi schema to validate against.
 * @returns {T} The validated parameters.
 * @throws {InvalidParameterError} If the parameters are invalid.
 */
export function validateParameters<T>(parameters: any, schema: Joi.ObjectSchema<T>): T {
  const { error, value } = schema.validate(parameters ?? {});
  if (error) {
    throw new InvalidParameterError(`Invalid parameters: ${error.message}`);
  }
  return value;
}

/**
 * Checks if any child task has a specific status.
 * @param {Container} parent - The parent container.
 * @param {TaskStatus | ((status: TaskStatus) => boolean)} status - The status to check for.
 * @param {boolean} all - Whether all children should match the status.
 * @returns {boolean} True if any (or all, based on the `all` parameter) child task has the specified status, false otherwise.
 */
export function childHasStatus(
  parent: Container,
  status: TaskStatus | ((status: TaskStatus) => boolean),
  all: boolean,
): boolean {
  let matchStatus = false;
  scanAllTasks(parent.tasks ?? {}, true, (task) => {
    matchStatus = typeof status === 'function' ? status(task.status) : task.status === status;
    if (matchStatus && !all) {
      // exit out of the scan
      return false;
    }
    if (!matchStatus && all) {
      // exit out of the scan
      return false;
    }
    // continue scanning & checking
    return true;
  });

  return matchStatus;
}

/**
 * Gets all tasks with a specific status.
 * @param {Container} parent - The parent container.
 * @param {TaskStatus} status - The status to filter tasks by.
 * @param {boolean} deep - Whether to recurse into child tasks.
 * @returns {WorkflowTasks} An object containing tasks with the specified status.
 */
export function getTasksByStatus(parent: Container, status: TaskStatus, deep: boolean): WorkflowTasks {
  const openTasks: WorkflowTasks = {};
  scanAllTasks(parent.tasks ?? {}, deep, (task, name) => {
    if (task.status === status) {
      openTasks[name] = task;
    }
    return true;
  });
  return openTasks;
}

/**
 * Scans all tasks and applies a callback function.
 * @param {WorkflowTasks} tasks - The tasks to scan.
 * @param {boolean} deep - Whether to recurse into child tasks.
 * @param {(task: Task, name: string) => boolean} callback - The callback function to apply to each task.
 * @returns {boolean} True if the scan completed, false if it was stopped by the callback.
 */
export function scanAllTasks(
  tasks: WorkflowTasks,
  deep: boolean,
  callback: (task: Task, name: string) => boolean,
): boolean {
  let scanning = true;
  const taskNames = Object.keys(tasks);
  for (const taskName of taskNames) {
    scanning = callback(tasks[taskName]!, taskName);
    if (!scanning) {
      break;
    }
    if (tasks[taskName]?.tasks && deep) {
      scanning = scanAllTasks(tasks[taskName].tasks, true, callback);
      if (!scanning) {
        break;
      }
    }
  }
  return scanning;
}

/**
 * Checks if a WorkflowTaskDefs object is an array.
 * @param {WorkflowTaskDefs} [tasks] - The WorkflowTaskDefs object to check.
 * @returns {boolean} True if the object is an array, false otherwise.
 */
export function isWorkflowTaskDefsArray(tasks?: WorkflowTaskDefs): tasks is TaskDef[] {
  return Array.isArray(tasks);
}

/**
 * Checks if a WorkflowTaskDefs object is empty.
 * @param {WorkflowTaskDefs} [tasks] - The WorkflowTaskDefs object to check.
 * @returns {boolean} True if the object is empty, false otherwise.
 */
export function isWorkflowTaskDefsEmpty(tasks?: WorkflowTaskDefs): boolean {
  if (!tasks) {
    return true;
  }
  return isWorkflowTaskDefsArray(tasks) ? tasks.length === 0 : Object.keys(tasks).length === 0;
}

/**
 * Counts the number of tasks.
 * @param {WorkflowTasks} [tasks] - The tasks to count.
 * @param {boolean} [deep=true] - Whether to recurse into child tasks.
 * @returns {number} The number of tasks.
 */
export function countTasks(tasks: WorkflowTasks | undefined, deep: boolean = true): number {
  let count = 0;
  scanAllTasks(tasks ?? {}, deep, () => {
    count++;
    return true;
  });
  return count;
}

/**
 * Checks if a task status is a terminated status.
 * @param {TaskStatus} status - The task status to check.
 * @returns {boolean} True if the status is terminated, false otherwise.
 */
export function isTerminatedStatus(status: TaskStatus): boolean {
  const terminatedStatuses: TaskStatus[] = ['completed', 'error', 'cancelled'];
  return terminatedStatuses.includes(status);
}
