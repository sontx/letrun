import { Plugin, TaskHandlerInput, TaskHandlerOutput } from '@src/model';

export const TASK_INVOKER_PLUGIN = 'task-invoker';

export interface TaskInvoker extends Plugin {
  invoke(input: TaskHandlerInput): Promise<TaskHandlerOutput>;
}
