import {
  AbstractPlugin,
  BUILTIN_PLUGIN_PRIORITY,
  defaultModuleResolver,
  getEntryPointDir,
  MODULE_LOCATION_RESOLVER_PLUGIN,
  ModuleLocationResolver,
  TASK_INVOKER_PLUGIN,
  TaskInvoker,
} from '@letrun/core';
import path from 'node:path';
import { InvalidParameterError, Task, TaskHandlerInput, TaskHandlerOutput } from "@letrun/common";

export default class DefaultTaskInvoker extends AbstractPlugin implements TaskInvoker {
  readonly name = 'default';
  readonly type = TASK_INVOKER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  constructor(private readonly moduleResolver = defaultModuleResolver.resolve) {
    super();
  }

  async invoke(input: TaskHandlerInput): Promise<TaskHandlerOutput> {
    const {
      task,
      session: { systemTasks },
      context,
    } = input;
    if (systemTasks[task.taskDef.handler]) {
      context.getLogger().verbose(`Invoking system task: ${task.taskDef.handler}`);
      return await systemTasks[task.taskDef.handler]?.handle(input);
    } else {
      context.getLogger().verbose(`Invoking external task: ${task.taskDef.handler}`);
      return await this.runExternalHandler(task, input);
    }
  }

  private async runExternalHandler(task: Task, input: TaskHandlerInput) {
    const tasksDir = await input.context.getConfigProvider().get('task.dir', 'tasks');
    const customTasksDir = path.resolve(getEntryPointDir(), tasksDir);

    const location = await input.context
      .getPluginManager()
      .callPluginMethod<
        ModuleLocationResolver,
        string
      >(MODULE_LOCATION_RESOLVER_PLUGIN, 'resolveLocation', task.taskDef.handler, customTasksDir, true);

    if (!location) {
      throw new InvalidParameterError(`Cannot find module: ${task.taskDef.handler}`);
    }

    input.context.getLogger().verbose(`Invoking external task: ${location}`);
    const handlerClass = await this.moduleResolver(location);
    const handler = new handlerClass();
    const rawResult = handler.handle(input) as Promise<TaskHandlerOutput> | TaskHandlerOutput;
    return rawResult instanceof Promise ? await rawResult : rawResult;
  }
}
