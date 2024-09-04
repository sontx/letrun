import {
  AbstractPlugin,
  BUILTIN_PLUGIN_PRIORITY,
  defaultTaskGroupResolver,
  defaultTaskHandlerParser,
  TASK_HANDLER_LOCATION_RESOLVER_PLUGIN,
  TASK_INVOKER_PLUGIN,
  TaskGroupResolverFn,
  TaskHandlerLocationResolver,
  TaskHandlerParserFn,
  TaskInvoker,
  withAwait,
} from '@letrun/core';
import {
  InvalidParameterError,
  Task,
  TaskGroup,
  TaskHandler,
  TaskHandlerInput,
  TaskHandlerOutput,
  UNCATEGORIZED_TASK_GROUP,
} from '@letrun/common';

export default class DefaultTaskInvoker extends AbstractPlugin implements TaskInvoker {
  readonly name = 'default';
  readonly type = TASK_INVOKER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  private cachedTaskGroups = new Map<string, TaskGroup>();

  constructor(
    private readonly taskGroupResolver: TaskGroupResolverFn = defaultTaskGroupResolver.resolve,
    private readonly handlerParser: TaskHandlerParserFn = defaultTaskHandlerParser.parse,
  ) {
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
      return await withAwait(systemTasks[task.taskDef.handler]?.handle(input));
    } else {
      context.getLogger().verbose(`Invoking external task: ${task.taskDef.handler}`);
      return await this.runExternalHandler(task, input);
    }
  }

  private async runExternalHandler(task: Task, input: TaskHandlerInput) {
    const handler = await this.getTaskHandler(task, input);
    return await withAwait(handler.handle(input));
  }

  private async getTaskHandler(task: Task, input: TaskHandlerInput): Promise<TaskHandler> {
    const handler = task.taskDef.handler;
    const parsedHandler = this.handlerParser(handler);

    const location = await input.context
      .getPluginManager()
      .callPluginMethod<
        TaskHandlerLocationResolver,
        string
      >(TASK_HANDLER_LOCATION_RESOLVER_PLUGIN, 'resolveLocation', parsedHandler, true);

    if (!location) {
      throw new InvalidParameterError(`Cannot find module: ${handler}`);
    }

    const taskGroup = this.cachedTaskGroups.get(location) ?? (await this.taskGroupResolver(location));
    const tasks = taskGroup.tasks ?? {};
    this.cachedTaskGroups.set(location, taskGroup);

    const taskNames = Object.keys(tasks);
    if (taskGroup.name === UNCATEGORIZED_TASK_GROUP.name && taskNames.length === 1) {
      return tasks[taskNames[0]!]!;
    }

    const taskName = parsedHandler.taskName;
    if (!taskName) {
      throw new InvalidParameterError(`Task name is required for handler: ${handler}`);
    }

    const taskHandler = tasks[taskName] ?? tasks[taskName.toLowerCase()];
    if (!taskHandler) {
      throw new InvalidParameterError(`Cannot find task "${taskName}" in handler "${handler}"`);
    }

    return taskHandler;
  }
}
