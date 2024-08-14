import {
  AppContext,
  Container,
  ExecutionSession,
  IdGenerator,
  IllegalStateError,
  PARAMETER_INTERPOLATOR_PLUGIN,
  ParameterInterpolator,
  Runner,
  scanAllTasks,
  Task,
  TaskHandler,
  TasksFactory,
  Workflow,
  WorkflowTasks,
} from '@letrun/core';

const MAX_RECURSION_LEVEL = 10;

/**
 * Class representing the default execution session.
 * Implements the ExecutionSession interface.
 */
export class DefaultExecutionSession implements ExecutionSession {
  private readonly registeredTasks: Map<string, Task> = new Map<string, Task>();
  private readonly interpolatorContext: Record<string, any> = {};

  constructor(
    public readonly workflow: Workflow,
    public readonly tasksFactory: TasksFactory,
    public readonly runner: Runner,
    public readonly systemTasks: Record<string, TaskHandler>,
    private readonly context: AppContext,
    private readonly idGenerator: IdGenerator,
  ) {
    this.registerTasks(workflow);
    this.interpolatorContext['workflow'] = workflow;
  }

  private registerTasks(container: Container) {
    scanAllTasks(container.tasks ?? {}, true, (task) => {
      this.registeredTasks.set(task.id, task);
      if (task.runtimeName! in this.interpolatorContext) {
        this.context.getLogger().warn(`Task with name ${task.runtimeName} already exists in the interpolator context`);
      }
      this.interpolatorContext[task.runtimeName!] = task;
      return true;
    });
  }

  getParentTask(task: Task, checkParentFn?: (parentTask: Task) => boolean): Task | undefined {
    let currentId = task.id;
    do {
      const parentId = this.idGenerator.getParentId(currentId);
      if (!parentId) {
        return undefined;
      }

      const parentTask = this.registeredTasks.get(parentId);
      if (!parentTask) {
        continue;
      }

      if (!checkParentFn) {
        return parentTask;
      }

      if (checkParentFn(parentTask)) {
        return parentTask;
      }
    } while (true);
  }

  setTasks(parentTask: Task, tasks: WorkflowTasks): void {
    this.clearTasks(parentTask);
    parentTask.tasks = tasks;
    this.registerTasks(parentTask);
  }

  clearTasks(parentTask: Task): void {
    scanAllTasks(parentTask.tasks ?? {}, true, (task) => {
      this.registeredTasks.delete(task.id);
      delete this.interpolatorContext[task.runtimeName!];
      return true;
    });
    parentTask.tasks = {};
  }

  async resolveParameter<T = any>(
    parameterValue: T,
    propertyResolver?: ParameterInterpolator,
    recursionLevel?: number,
  ): Promise<T> {
    if (!parameterValue) {
      return parameterValue;
    }

    const maxRecursionLevel = await this.context
      .getConfigProvider()
      .getInt('interpolator.maxRecursionLevel', MAX_RECURSION_LEVEL);
    if (recursionLevel && recursionLevel > maxRecursionLevel) {
      this.context.getLogger().warn(`Max ${recursionLevel} recursion level reached for parameter: ${parameterValue}`);
      return parameterValue;
    }

    if (!propertyResolver) {
      propertyResolver = await this.context
        ?.getPluginManager()
        .getOne<ParameterInterpolator>(PARAMETER_INTERPOLATOR_PLUGIN);
      if (!propertyResolver) {
        throw new IllegalStateError('PropertyResolver not found');
      }
    }

    switch (typeof parameterValue) {
      case 'object':
        return this.resolveObject(parameterValue, propertyResolver, recursionLevel ?? 0);
      case 'string':
        return propertyResolver.interpolate(parameterValue, this.interpolatorContext);
      default:
        return parameterValue;
    }
  }

  /**
   * Resolves an object parameter value.
   * @private
   * @param {T} parameterValue - The object parameter value to resolve.
   * @param {ParameterInterpolator} propertyResolver - The property resolver.
   * @param {number} recursionLevel - The current recursion level.
   * @returns {Promise<T>} A promise that resolves with the resolved object parameter value.
   */
  private async resolveObject<T>(
    parameterValue: T,
    propertyResolver: ParameterInterpolator,
    recursionLevel: number,
  ): Promise<T> {
    if (Array.isArray(parameterValue)) {
      return (await Promise.all(
        parameterValue.map((value) => this.resolveParameter(value, propertyResolver, recursionLevel + 1)),
      )) as any;
    }

    const result: any = {};
    for (const key in parameterValue) {
      result[key] = await this.resolveParameter(parameterValue[key]!, propertyResolver, recursionLevel + 1);
    }
    return result;
  }
}
