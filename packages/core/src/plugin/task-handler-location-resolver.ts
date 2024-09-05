import { ParsedHandler, Plugin } from '@letrun/common';

/**
 * Constant representing the task handler location resolver plugin type.
 * @type {string}
 */
export const TASK_HANDLER_LOCATION_RESOLVER_PLUGIN: string = 'task-handler-location-resolver';

export type LocationResolverFn = (handler: ParsedHandler, tasksDir?: string) => Promise<string | null>;

/**
 * Interface for a task handler location resolver plugin.
 * Extends the Plugin interface.
 *
 * @interface TaskHandlerLocationResolver
 * @extends {Plugin}
 */
export interface TaskHandlerLocationResolver extends Plugin {
  readonly type: typeof TASK_HANDLER_LOCATION_RESOLVER_PLUGIN;

  resolveLocation(handler: ParsedHandler, throwsIfNotFound?: boolean): Promise<string | null>;
}
