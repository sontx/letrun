import {
  AbstractPlugin,
  BUILTIN_PLUGIN_PRIORITY,
  childHasStatus,
  ConfigNotFoundError,
  countTasks,
  ExecutablePlugin,
  ExecutionSession,
  getTasksByStatus,
  IllegalStateError,
  InterruptInvokeError,
  InvalidParameterError,
  isDefined,
  isTerminatedStatus,
  POST_RUN_TASK_PLUGIN,
  PRE_RUN_TASK_PLUGIN,
  RerunError,
  RETRY_PLUGIN,
  RetryConfig,
  RetryPlugin,
  scanAllTasks,
  Task,
  TASK_INVOKER_PLUGIN,
  TaskHandlerInput,
  TaskInvoker,
  Workflow,
  WORKFLOW_RUNNER_PLUGIN,
  WorkflowRunner,
  WorkflowRunnerInput,
  WorkflowTasks,
} from '@letrun/core';

const SYSTEM_ERRORS = [
  InterruptInvokeError.name,
  RerunError.name,
  InvalidParameterError.name,
  IllegalStateError.name,
  ConfigNotFoundError.name,
];

export default class DefaultWorkflowRunner extends AbstractPlugin implements WorkflowRunner {
  readonly name = 'default';
  readonly type = WORKFLOW_RUNNER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  async execute(input: WorkflowRunnerInput) {
    const { workflow } = input;
    await this.preWorkflowRun(workflow);
    return await this.runWorkflow(input);
  }

  private async preWorkflowRun(workflow: Workflow) {
    const pluginManager = this.context!.getPluginManager();
    await pluginManager.callPluginMethod<ExecutablePlugin>('pre-workflow-run', 'execute', {
      workflow,
      context: this.context,
    });
  }

  private getContext() {
    if (!this.context) {
      throw new IllegalStateError('Context not loaded');
    }
    return this.context;
  }

  private async runWorkflow(input: WorkflowRunnerInput, lastResult?: any): Promise<any> {
    if (!this.isLoaded) {
      throw new InterruptInvokeError('WorkflowRunner is unloaded');
    }

    const { workflow } = input;

    if (input.session.signal.aborted) {
      return lastResult;
    }

    // there may be some parent tasks that are in executing status,
    // we need to close them whenever all their children are completed or one of them failed
    await this.closeParentTasks(workflow);

    //Open any waiting (and available) tasks
    this.openNextAvailableTask(workflow);

    //Get a list of ALL the open tasks
    const openTasks = getTasksByStatus(workflow, 'open', true);
    const openTaskNames = Object.keys(openTasks);
    if (openTaskNames.length) {
      this.context?.getLogger()?.verbose(`Found open task(s): ${openTaskNames.join(', ')}`);
    } else {
      this.context?.getLogger()?.verbose('No open tasks found');
    }

    this.logAllTaskStatuses(workflow);

    //Initialise the task execution queue
    const taskExecutionQueue: (() => Promise<any>)[] = [];

    //This function will return a function to be used by async that calls the
    //appropriate handler (as defined by the task)
    const makeTaskExecutionFunction = (index: number) => {
      return () => {
        const taskObject = openTasks[openTaskNames[index]!]!;
        return this.executeTask({
          workflow,
          task: taskObject,
          context: this.getContext(),
          session: input.session,
        });
      };
    };

    //Now cycle through the open tasks, check them to see if they can be executed,
    //and if so, pushed onto the queue
    for (let index = 0; index < openTaskNames.length; index++) {
      //make a new execution function ready for async
      const taskFunction = makeTaskExecutionFunction(index);
      const taskName = openTaskNames[index]!;
      const task = openTasks[taskName]!;

      const hasChildren = countTasks(task.tasks) > 0;

      //if the task is open and has no children, queue it to execute
      if (!hasChildren) {
        await this.setTaskDataValues(input.session, task);
        task.status = 'executing';
        taskExecutionQueue.push(taskFunction);
        this.context
          ?.getLogger()
          ?.verbose(`Task ${taskName} is queued for execution because its status is 'open' and has no children.`);
      } else {
        //if the task has children, but they're ALL terminated, queue it to execute, that means the parent will be the last one to execute
        if (childHasStatus(task, (status) => isTerminatedStatus(status), true)) {
          await this.setTaskDataValues(input.session, task);
          task.status = 'executing';
          taskExecutionQueue.push(taskFunction);
          this.context
            ?.getLogger()
            ?.verbose(
              `Task ${taskName} is queued for execution because its status is 'open' and all children are terminated.`,
            );
        } else {
          //if the task has children, but they're NOT all completed, then we need to wait
          this.context
            ?.getLogger()
            ?.verbose(
              `Task ${taskName} is not queued for execution because its status is 'open' and not all children are terminated.`,
            );
        }
      }
    }

    //Assuming we actually have any valid tasks to execute, let async call them in parallel
    if (taskExecutionQueue.length > 0) {
      if (taskExecutionQueue.length > 1) {
        this.context?.getLogger()?.debug(`Executing ${taskExecutionQueue.length} tasks in parallel`);
      }
      try {
        const result = await Promise.all(taskExecutionQueue.map((fn) => fn()));
        return await this.runWorkflow(input, result.length === 1 ? result[0] : result);
      } catch (e: any) {
        // close parent tasks if there is an error in the task execution
        await this.closeParentTasks(workflow);
        throw e;
      }
    } else {
      this.context?.getLogger()?.debug('No tasks to execute');
    }

    return lastResult;
  }

  private logAllTaskStatuses(workflow: Workflow) {
    const allTaskStatuses: string[] = [];
    scanAllTasks(workflow.tasks ?? {}, true, (task, name) => {
      allTaskStatuses.push(`${name}: ${task.status}`);
      return true;
    });
    this.context?.getLogger()?.verbose(`All task: ${allTaskStatuses.join(', ')}`);
  }

  private async closeParentTasks(workflow: Workflow) {
    const executingTasks = getTasksByStatus(workflow, 'executing', true);
    const terminatedTasks: Task[] = [];
    scanAllTasks(executingTasks, false, (task, name) => {
      const oldStatus = task.status;
      const areAllChildrenCompleted = childHasStatus(task, 'completed', true);
      if (areAllChildrenCompleted) {
        task.status = 'completed';
        this.completeTask(task);
        this.context?.getLogger()?.debug(`Task ${name} is completed because all children are completed.`);
      }
      const hasErrorChild = childHasStatus(task, 'error', false);
      if (hasErrorChild) {
        task.status = 'error';
        this.context?.getLogger()?.debug(`Task ${name} is error because it has error children.`);
      }

      // if the task is completed or error, we need to send the post task run event
      if (oldStatus !== task.status && (task.status === 'completed' || task.status === 'error')) {
        terminatedTasks.push(task);
      }

      return true;
    });

    for (const task of terminatedTasks) {
      await this.postTaskRun(workflow, task, task.output, task.error);
    }
  }

  private async setTaskDataValues(session: ExecutionSession, task: Task) {
    task.parameters = await session.resolveParameter(task.taskDef.parameters);
  }

  // opens next available tasks and returns if true if there are any waiting
  private openNextAvailableTask(workflow: Workflow) {
    this.openTasks(workflow.tasks ?? {});
    //return true if there are any open tasks
    return childHasStatus(workflow, 'open', false);
  }

  // open any tasks that are 'ready' to be opened
  private openTasks(tasks: WorkflowTasks) {
    scanAllTasks(tasks, false, (task) => {
      //If... we're still updating, the task is waiting and none of its children are waiting
      if (task.status === 'open') {
        //task is open, but does it have ANY children waiting?
        if (childHasStatus(task, 'waiting', false)) {
          //it does, so let's go down and check those first
          this.openTasks(task.tasks ?? {});
        }
        //if the task is blocking return false to signify to scanAllTasks that we don't
        //to continue scanning
        return !task.blocking;
      }

      //the task is waiting, so let's open it and check its children (if any)
      if (task.status === 'waiting') {
        task.status = 'open';
        task.timeOpened = Date.now();
        //we've opened the task, so open it's children (if any)
        if (task.tasks) {
          this.openTasks(task.tasks);
        }
        //if the task is blocking, then don't continue
        return !task.blocking;
      }

      //if task is executing, check if it has any children that are waiting then open them
      if (task.status === 'executing') {
        this.openTasks(task.tasks ?? {});
        //if the task is blocking, then don't continue
        return !task.blocking;
      }

      //carry on!
      return true;
    });
  }

  private async executeTask(input: TaskHandlerInput) {
    const task = input.task;
    const taskName = input.task.runtimeName;
    task.timeStarted = Date.now();

    await this.preTaskRun(input.workflow, task);

    //No error or skip condition so execute handler
    this.context?.getLogger()?.info(`Starting task ${taskName}`);
    let output: any;
    let error: any;

    try {
      const pluginManager = this.getContext().getPluginManager();
      const retryPlugin = await pluginManager.getOne<RetryPlugin>(RETRY_PLUGIN);
      output = await retryPlugin.retry({
        retryable: task,
        config: this.lookupRetryConfig(task, input.session),
        shouldRetryFn: (err) => !SYSTEM_ERRORS.includes(err.name),
        doJob: () => pluginManager.callPluginMethod<TaskInvoker>(TASK_INVOKER_PLUGIN, 'invoke', input),
        signal: input.session.signal,
      });
      this.context?.getLogger()?.info(`Task ${taskName} is completed successfully.`);
    } catch (e: any) {
      if (e.name === RerunError.name) {
        this.context?.getLogger()?.verbose(`Task ${taskName} is rerunning.`);
        // will run all the children if exists and then rerun this task
        task.status = 'open';
      } else {
        error = e;
        // some cases the output is set inside the task handler,
        // because we can't return output value from the return statement by throwing an intended error
        output = task.output;
        if (task.taskDef.ignoreError) {
          this.context?.getLogger()?.warn(`Ignoring error for task ${taskName}: ${e.message}`);
          task.status = 'executing';
          error = null;
        } else {
          task.errorMessage = e.message;
          task.error = e;
          task.status = 'error';

          const parentCatchTask = input.session.getParentTask(
            task,
            (parentTask) => parentTask.taskDef.handler === 'catch',
          );
          if (parentCatchTask) {
            this.context
              ?.getLogger()
              ?.debug(
                `Task ${taskName} was thrown an error but it is handled by a catch task ${parentCatchTask.runtimeName}.`,
              );
            this.cancelTasksInsideCatchTask(parentCatchTask);
            error = null;
          } else {
            this.context?.getLogger()?.error(`Error while executing task ${taskName}:`, e);
          }
        }
      }
    }

    if (task.status === 'executing') {
      const hasChildren = countTasks(task.tasks) > 0;
      const areAllChildrenCompleted = childHasStatus(task, 'completed', true);
      if (hasChildren && !areAllChildrenCompleted) {
        this.context
          ?.getLogger()
          ?.debug(
            `Task ${taskName} is finished but it has pending children which are added by this task, we'll keep its 'waiting' status, the children are going to execute.`,
          );
      } else {
        task.status = 'completed';
      }
      this.completeTask(task);
      task.output = output;
    }

    // only terminated task will need to send the post task run event,
    // some tasks may be still executing at this point
    if (task.status === 'error' || task.status === 'completed') {
      await this.postTaskRun(input.workflow, task, output, error);
    }

    if (error && task.status === 'error') {
      throw new Error(`Error executing task ${taskName}`, { cause: error });
    }

    return input.task.output;
  }

  private lookupRetryConfig(task: Task, session: ExecutionSession): RetryConfig {
    const config: RetryConfig = {};

    let currentTask: Task | undefined = task;

    while (currentTask) {
      const taskDef = currentTask.taskDef;
      if (!taskDef) {
        break;
      }

      // Check if the current task has any of the retry config properties
      if (isDefined(taskDef.retryCount) && !isDefined(config.retryCount)) {
        config.retryCount = taskDef.retryCount;
      }
      if (isDefined(taskDef.retryStrategy) && !isDefined(config.retryStrategy)) {
        config.retryStrategy = taskDef.retryStrategy;
      }
      if (isDefined(taskDef.retryDelaySeconds) && !isDefined(config.retryDelaySeconds)) {
        config.retryDelaySeconds = taskDef.retryDelaySeconds;
      }

      // If all properties are found, break the loop
      if (isDefined(config.retryCount) && isDefined(config.retryStrategy) && isDefined(config.retryDelaySeconds)) {
        break;
      }

      // Get the parent task and continue the search
      currentTask = session.getParentTask(currentTask);
    }

    return config;
  }

  private completeTask(task: Task) {
    task.timeCompleted = Date.now();
    task.handlerDuration = task.timeCompleted - task.timeStarted!;
    task.totalDuration = task.timeCompleted - task.timeOpened!;
  }

  private cancelTasksInsideCatchTask(catchTask: Task) {
    let count = 0;
    scanAllTasks(catchTask.tasks ?? {}, true, (task) => {
      // tasks are going to execute will be cancelled
      if (['open', 'waiting'].includes(task.status)) {
        task.status = 'cancelled';
        count++;
      }
      return true;
    });
    this.context?.getLogger()?.debug(`Cancelled ${count} tasks inside catch task ${catchTask.runtimeName}.`);
  }

  private async preTaskRun(workflow: Workflow, task: Task) {
    const pluginManager = this.getContext().getPluginManager();
    await pluginManager.callPluginMethod<ExecutablePlugin>(PRE_RUN_TASK_PLUGIN, 'execute', {
      workflow,
      task,
      context: this.getContext(),
    });
  }

  private async postTaskRun(workflow: Workflow, task: Task, result: any, error: any) {
    const pluginManager = this.getContext().getPluginManager();
    await pluginManager.callPluginMethod<ExecutablePlugin>(POST_RUN_TASK_PLUGIN, 'execute', {
      workflow,
      task,
      result,
      error,
      context: this.getContext(),
    });
  }
}
