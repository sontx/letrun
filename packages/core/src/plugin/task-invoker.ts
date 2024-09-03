import { Plugin, TaskHandlerInput, TaskHandlerOutput } from '@letrun/common';

export const TASK_INVOKER_PLUGIN = 'task-invoker';

export interface TaskInvoker extends Plugin {
  readonly type: typeof TASK_INVOKER_PLUGIN;

  invoke(input: TaskHandlerInput): Promise<TaskHandlerOutput>;
}
