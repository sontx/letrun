/**
 * The priority of the built-in plugins.
 * This should be less than the default plugin priority.
 */
export const BUILTIN_PLUGIN_PRIORITY = -1;

/**
 * The default priority of the plugins if the {@link Plugin.priority} is not specified.
 */
export const DEFAULT_PLUGIN_PRIORITY = 0;

/**
 * Handle pre-run workflow event.
 */
export const PRE_RUN_WORKFLOW_PLUGIN = 'pre-run-workflow';

/**
 * Handle post-run workflow event.
 */
export const POST_RUN_WORKFLOW_PLUGIN = 'post-run-workflow';

/**
 * Handle pre-run task event.
 */
export const PRE_RUN_TASK_PLUGIN = 'pre-run-task';

/**
 * Handle post-run task event.
 */
export const POST_RUN_TASK_PLUGIN = 'post-run-task';
