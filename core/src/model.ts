import { FunctionKeys, ObjectType } from './types';

/**
 * Interface representing a workflow definition.
 * Extends the ContainerDef interface.
 */
export interface WorkflowDef extends ContainerDef {}

/**
 * Interface representing a workflow, generated based on the {@link WorkflowDef} automatically.
 * Holds the runtime information of the workflow.
 * Extends the Container interface.
 */
export interface Workflow extends Container {
  /** The status of the workflow. */
  status: WorkflowStatus;
  /** Optional variables associated with the workflow. All tasks inside this workflow can access and change variables whenever they want. */
  variables?: ObjectType;
}

/** Type representing the possible statuses of a workflow. */
export type WorkflowStatus = 'open' | 'executing' | 'error' | 'completed';

/** Type representing a collection of workflow tasks. */
export type WorkflowTasks = Record<string, Task>;

/**
 * Interface representing a task, generated based on the {@link TaskDef} automatically.
 * Holds the runtime information of the task.
 * Extends the Container interface.
 */
export interface Task extends Container {
  /** Runtime name of the task. It may be the same as the {@link TaskDef.name} in most cases.
   * In looping cases, it may depend on the iteration.
   * */
  runtimeName: string;
  /** The status of the task. */
  status: TaskStatus;
  /** Optional time when the task was opened and ready for execution. */
  timeOpened?: number;
  /** Optional total duration of the task from {@link Task.timeOpened} to {@link Task.timeCompleted}. */
  totalDuration?: number;
  /** Optional flag indicating if the task is in a blocking state.
   * Other sibling tasks will wait for this task to be done before they can be queued for execution.
   * */
  blocking?: boolean;
  /** Optional parameters for the task, calculated after being interpolated by the {@link TaskDef.parameters}. */
  parameters?: ObjectType;
  /** The task definition associated with the task. */
  taskDef: TaskDef;
  /** Optional tasks to execute when the {@link TaskDef.handler} is 'if' and the condition is true. */
  then?: WorkflowTasks;
  /** Optional tasks to execute if the {@link TaskDef.handler} is 'if' and the condition is false. */
  else?: WorkflowTasks;
  /** Optional decision cases containing case-task mappings,
   * executed if the {@link TaskDef.handler} is 'switch' and there is a matched case.
   * */
  decisionCases?: Record<string, WorkflowTasks>;
  /** Optional default case to execute if the {@link TaskDef.handler} is 'switch' and there are no matched cases. */
  defaultCase?: WorkflowTasks;
  /** Optional tasks executed if the {@link TaskDef.handler} is either 'for' or 'while' when looped over the {@link TaskDef.loopOver}. */
  loopOver?: Task[];
  /** Optional tasks to execute if an error occurs and the {@link TaskDef.handler} is 'catch'. */
  catch?: WorkflowTasks;
  /** Optional tasks to execute if the {@link TaskDef.handler} is 'catch' right after the {@link TaskDef.catch} block. */
  finally?: WorkflowTasks;
}

/**
 * Interface representing a container.
 */
export interface Container {
  /** The unique identifier of the container. */
  id: string;
  /** Optional input data for the container, calculated after being interpolated by the {@link ContainerDef.input}. */
  input?: ObjectType;
  /** Optional output data for the container. */
  output?: any;
  /** Optional tasks to be executed. */
  tasks?: WorkflowTasks;
  /** Optional time when the container started. */
  timeStarted?: number;
  /** Optional time when the container completed. */
  timeCompleted?: number;
  /** Optional duration of the handler execution. */
  handlerDuration?: number;
  /** Optional error message if an error occurred. */
  errorMessage?: string;
  /** Additional properties for the container. */
  [key: string]: any;
}

/** Type representing a collection of task definitions.
 * Tasks are either in array style (run sequence) or map style (run parallel).
 * */
export type WorkflowTaskDefs = Record<string, TaskDef> | TaskDef[];

/**
 * Interface representing a task definition.
 * Extends the ContainerDef interface.
 */
export interface TaskDef extends ContainerDef {
  /** The title of the task definition. */
  title?: string;
  /** Optional flag to ignore errors and let other tasks continue running. */
  ignoreError?: boolean;
  /** The handler of the task. This may be the system task type or the path to the task's handler, which will handle the whole logic of this task. */
  handler: string;
  /** Optional parameters for the task, supporting interpolating values. */
  parameters?: ObjectType;
  /** Optional tasks to execute when the {@link TaskDef.handler} is 'if' and the condition is true. */
  then?: WorkflowTaskDefs;
  /** Optional tasks to execute if the {@link TaskDef.handler} is 'if' and the condition is false. */
  else?: WorkflowTaskDefs;
  /** Optional decision cases containing case-task mappings, executed if the {@link TaskDef.handler} is 'switch' and there is a matched case. */
  decisionCases?: Record<string, WorkflowTaskDefs>;
  /** Optional default case to execute if the {@link TaskDef.handler} is 'switch' and there are no matched cases. */
  defaultCase?: WorkflowTaskDefs;
  /** Optional tasks iterated if the {@link TaskDef.handler} is either 'for', 'while' or 'iterate'. */
  loopOver?: WorkflowTaskDefs;
  /** Optional tasks to execute if an error occurs and the {@link TaskDef.handler} is 'catch'. */
  catch?: WorkflowTaskDefs;
  /** Optional tasks to execute if the {@link TaskDef.handler} is 'catch' right after the {@link TaskDef.catch} block. */
  finally?: WorkflowTaskDefs;
}

/**
 * Interface representing a container definition.
 */
export interface ContainerDef {
  /** Name of the container definition, useful for distinguishing and referencing for interpolating values
   * from either the {@link ContainerDef.input} or {@link TaskDef.parameters}.
   * */
  name: string;
  /** Optional input data for the container definition, supporting interpolating values when it's {@link TaskDef}. */
  input?: any;
  /** Optional task definitions associated with the container definition, executed before this task is completed. */
  tasks?: WorkflowTaskDefs;
  /** Additional properties for the container definition. */
  [key: string]: any;
}

/** Type representing the possible statuses of a task. */
export type TaskStatus = 'open' | 'paused' | 'waiting' | 'executing' | 'error' | 'completed' | 'cancelled';

/**
 * Interface representing the input for a task handler.
 */
export interface TaskHandlerInput {
  /** The workflow associated with the task. */
  workflow: Workflow;
  /** The task to be handled. */
  task: Task;
  /** The application context. */
  context: AppContext;
  /** The execution session. */
  session: ExecutionSession;
}

/**
 * Interface representing a task handler.
 * Keeps the logic stateless because it will be recalled multiple times with different task data.
 */
export interface TaskHandler {
  /** The name of the task handler. */
  name: string;
  /** Optional description of the task handler. */
  description?: string;
  /** Optional parameters for the task handler, presenting the accepted parameters. */
  parameters?: ObjectType;
  /**
   * Handles the task.
   * @param input - The input for the task handler.
   * @returns A promise that resolves to the output of the task handler.
   */
  handle(input: TaskHandlerInput): Promise<TaskHandlerOutput>;
}

/** Type representing the output of a task handler. */
export type TaskHandlerOutput = any;

/**
 * Interface representing the lifecycle of a plugin.
 */
export interface PluginLifecycle {
  /**
   * Loads the plugin.
   * @param context - The application context.
   * @returns A promise that resolves when the plugin is loaded.
   */
  load(context: AppContext): Promise<void>;
  /**
   * Unloads the plugin.
   * @returns A promise that resolves when the plugin is unloaded.
   */
  unload(): Promise<void>;
}

/**
 * Interface representing a plugin.
 * Extends the PluginLifecycle interface.
 */
export interface Plugin extends PluginLifecycle {
  /** The name of the plugin. */
  readonly name: string;
  /** The type of the plugin. There may be multiple plugins with the same type but different names. */
  readonly type: string;
  /** Additional properties for the plugin. */
  [key: string]: any;
}

/**
 * Interface representing an executable plugin.
 * Extends the Plugin interface.
 * @template T - The type of the input for the plugin.
 */
export interface ExecutablePlugin<T = any> extends Plugin {
  /**
   * Executes the plugin.
   * @param input - The input for the plugin.
   * @returns A promise that resolves to the output of the plugin.
   */
  execute(input: T): Promise<any>;
}

/**
 * Interface representing a plugin manager.
 */
export interface PluginManager {
  /**
   * Registers a plugin.
   * @param plugin - The plugin to register.
   */
  register(plugin: Plugin): void;

  /**
   * Gets all registered plugins.
   */
  getAll(): Promise<Map<string, Plugin[]>>;

  /**
   * Gets plugins of a specific type.
   * @template T - The type of the plugins.
   * @param type - The type of the plugins.
   * @returns A promise that resolves to an array of plugins.
   */
  get<T extends Plugin>(type: string): Promise<T[]>;
  /**
   * Gets a single plugin of a specific type.
   * @template T - The type of the plugin.
   * @param type - The type of the plugin.
   * @returns A promise that resolves to the plugin.
   */
  getOne<T extends Plugin>(type: string): Promise<T>;
  /**
   * Calls a method on a plugin.
   * @template TPlugin - The type of the plugin.
   * @template TResult - The type of the result.
   * @param type - The type of the plugin.
   * @param method - The method to call.
   * @param args - The arguments for the method.
   * @returns A promise that resolves to the result of the method.
   */
  callPluginMethod<TPlugin extends Plugin = any, TResult = any>(
    type: string,
    method: FunctionKeys<TPlugin>,
    ...args: any[]
  ): Promise<TResult | undefined>;
  /**
   * Loads the plugin manager. All the plugins will also be loaded.
   * @param context - The application context.
   */
  load(context: AppContext): void;
  /**
   * Unloads the plugin manager.
   * @returns A promise that resolves when the plugin manager is unloaded.
   */
  unload(): Promise<void>;
}

/**
 * Interface representing a plugin loader.
 */
export interface PluginLoader {
  /**
   * Loads plugins.
   * @returns A promise that resolves to an array of plugins.
   */
  load(): Promise<Plugin[]>;
}

/**
 * Interface representing a module. It may be used for wrapping the logic of getting or loading plugins.
 */
export interface Module {
  /**
   * Loads the module.
   * @param context - The application context.
   * @returns A promise that resolves when the module is loaded.
   */
  load(context: AppContext): Promise<void>;
  /**
   * Unloads the module.
   * @returns A promise that resolves when the module is unloaded.
   */
  unload(): Promise<void>;
}

/**
 * Interface representing a configuration provider.
 */
export interface ConfigProvider {
  /**
   * Gets all configuration values.
   * @returns A promise that resolves to an object containing all configuration values.
   */
  getAll(): Promise<ObjectType>;
  /**
   * Gets a configuration value.
   * @param key - The key of the configuration value.
   * @param defaultValue - The default value if the key is not found.
   * @returns A promise that resolves to the configuration value.
   */
  get(key: string, defaultValue?: string): Promise<string>;
  /**
   * Gets a configuration value as an integer.
   * @param key - The key of the configuration value.
   * @param defaultValue - The default value if the key is not found.
   * @returns A promise that resolves to the configuration value as an integer.
   */
  getInt(key: string, defaultValue?: number): Promise<number>;
  /**
   * Gets a configuration value as a float.
   * @param key - The key of the configuration value.
   * @param defaultValue - The default value if the key is not found.
   * @returns A promise that resolves to the configuration value as a float.
   */
  getFloat(key: string, defaultValue?: number): Promise<number>;
  /**
   * Gets a configuration value as a boolean.
   * @param key - The key of the configuration value.
   * @param defaultValue - The default value if the key is not found.
   * @returns A promise that resolves to the configuration value as a boolean.
   */
  getBoolean(key: string, defaultValue?: boolean): Promise<boolean>;

  /**
   * Sets a configuration value to the in-memory store.
   */
  set(key: string, value: any): Promise<void>;
}

/**
 * Interface representing a logger.
 */
export interface Logger {
  /**
   * Logs a verbose message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  verbose(message: string, ...args: any[]): void;
  /**
   * Logs a debug message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  debug(message: string, ...args: any[]): void;
  /**
   * Logs an informational message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  info(message: string, ...args: any[]): void;
  /**
   * Logs a warning message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  warn(message: string, ...args: any[]): void;
  /**
   * Logs an error message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  error(message: string, ...args: any[]): void;
}

/**
 * Interface representing the application context.
 */
export interface AppContext {
  /**
   * Loads the application context.
   * @returns A promise that resolves when the context is loaded.
   */
  load(): Promise<void>;
  /**
   * Unloads the application context.
   * @returns A promise that resolves when the context is unloaded.
   */
  unload(): Promise<void>;
  /**
   * Gets the plugin manager.
   * @returns The plugin manager.
   */
  getPluginManager(): PluginManager;
  /**
   * Gets the configuration provider.
   * @returns The configuration provider.
   */
  getConfigProvider(): ConfigProvider;
  /**
   * Gets the logger.
   * @returns The logger.
   */
  getLogger(): Logger;
}

/**
 * Interface representing the options for a runner.
 */
export interface RunnerOptions {
  /** Optional file for the runner. */
  file?: string;
  /** Optional workflow for the runner. */
  workflow?: string | WorkflowDef | Workflow;
}

/**
 * Interface representing a runner, the main entry point for running a workflow.
 */
export interface Runner {
  /**
   * Loads the runner.
   * @param context - Optional application context.
   * @returns A promise that resolves when the runner is loaded.
   */
  load(context?: AppContext): Promise<void>;
  /**
   * Unloads the runner.
   * @returns A promise that resolves when the runner is unloaded.
   */
  unload(): Promise<void>;
  /**
   * Runs a workflow.
   * @param workflowDef - The workflow definition or workflow to run.
   * @param input - Optional input data for the workflow.
   * @returns A promise that resolves to the workflow.
   */
  run(workflowDef: WorkflowDef | Workflow, input?: any): Promise<Workflow | undefined>;
}

/**
 * Interface representing a tasks factory.
 */
export interface TasksFactory {
  /**
   * Creates tasks from task definitions.
   * @param taskDefs - The task definitions.
   * @param parentId - Optional parent ID for the tasks.
   * @returns The created tasks.
   */
  createTasks(taskDefs: WorkflowTaskDefs, parentId?: string): WorkflowTasks;
}

/**
 * Interface representing an execution session. Each time a workflow is executed, a new session is created.
 */
export interface ExecutionSession {
  /** The workflow associated with the session. */
  readonly workflow: Workflow;
  /** The tasks factory associated with the session. */
  readonly tasksFactory: TasksFactory;
  /** The runner associated with the session. */
  readonly runner: Runner;
  /**
   * A record of system tasks, where the key is the task name and the value is the task handler.
   */
  readonly systemTasks: Record<string, TaskHandler>;
  /**
   * Sets tasks for a parent task.
   * @param parentTask - The parent task.
   * @param tasks - The tasks to set.
   */
  setTasks(parentTask: Task, tasks: WorkflowTasks): void;
  /**
   * Clears tasks for a parent task.
   * @param parentTask - The parent task.
   */
  clearTasks(parentTask: Task): void;
  /**
   * Gets the parent task of a task.
   * @param task - The task.
   * @param checkParentFn - Optional function to check if the parent task matches the requirement.
   * @returns The parent task or undefined.
   */
  getParentTask(task: Task, checkParentFn?: (parentTask: Task) => boolean): Task | undefined;
  /**
   * Resolves a parameter value by interpolating against the workflow.
   * @template T - The type of the parameter value.
   * @param parameterValue - The parameter value.
   * @returns A promise that resolves to the parameter value.
   */
  resolveParameter<T = any>(parameterValue: T): Promise<T>;
}
