import {
  AbstractPlugin,
  BUILTIN_PLUGIN_PRIORITY,
  getEntryPointDir,
  importDefault,
  Task,
  TASK_INVOKER_PLUGIN,
  TaskHandlerInput,
  TaskHandlerOutput,
  TaskInvoker,
} from '@letrun/core';
import path from 'node:path';
import fs from 'fs';
import { InvalidParameterError } from '@letrun/core/dist';

export default class DefaultTaskInvoker extends AbstractPlugin implements TaskInvoker {
  readonly name = 'default';
  readonly type = TASK_INVOKER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  constructor(private readonly moduleResolver = importDefault) {
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
    const location = this.lookupJsFileLocation(task.taskDef.handler, customTasksDir);
    if (!location) {
      throw new InvalidParameterError(`Cannot find task handler: ${task.taskDef.handler}, we looked up in this order:
1. If this is an absolute path, we will use it as is
2. Resolve it from the current directory
3. Resolve it from the runner directory
4. Append the .js extension if missing, then look up in the custom tasks directory (default is tasks directory)`);
    }

    input.context.getLogger().verbose(`Invoking external task: ${location}`);
    const handlerClass = await this.moduleResolver(location);
    const handler = new handlerClass();
    const rawResult = handler.handle(input) as Promise<TaskHandlerOutput> | TaskHandlerOutput;
    return rawResult instanceof Promise ? await rawResult : rawResult;
  }

  /**
   * We will look up in this order:
   * 1. if this is an absolute path, we will use it as is
   * 2. resolve it from the current directory
   * 3. resolve it from the runner directory
   * 4. append the .js extension if missing, then look up in the custom tasks directory (default is tasks directory)
   */
  private lookupJsFileLocation(location: string, customTasksDir: string): string | null {
    if (path.isAbsolute(location)) {
      return location;
    }

    const pathResolvedFromCurrentDir = path.resolve(process.cwd(), location);
    if (fs.existsSync(pathResolvedFromCurrentDir)) {
      return pathResolvedFromCurrentDir;
    }

    const pathResolvedFromRunnerDir = path.resolve(getEntryPointDir(), location);
    if (fs.existsSync(pathResolvedFromRunnerDir)) {
      return pathResolvedFromRunnerDir;
    }

    const locationWithJsExtension = location.endsWith('.js') ? location : `${location}.js`;
    const pathResolvedFromCustomTasksDir = path.resolve(customTasksDir, locationWithJsExtension);
    if (fs.existsSync(pathResolvedFromCustomTasksDir)) {
      return pathResolvedFromCustomTasksDir;
    }

    return null;
  }
}
