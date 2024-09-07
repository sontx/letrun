import { Plugin, TaskHandlerInput } from '@letrun/common';

export const TASK_INVOKER_PLUGIN = 'task-invoker';

export interface TaskInvoker extends Plugin {
  readonly type: typeof TASK_INVOKER_PLUGIN;

  invoke<T = any>(input: TaskHandlerInput): Promise<T>;
}
