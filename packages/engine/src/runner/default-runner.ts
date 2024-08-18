import {
  AppContext,
  ExecutablePlugin,
  ID_GENERATOR_PLUGIN,
  IdGenerator,
  IllegalStateError,
  InterruptInvokeError,
  InvalidParameterError,
  Logger,
  POST_RUN_WORKFLOW_PLUGIN,
  PRE_RUN_WORKFLOW_PLUGIN,
  Runner,
  TasksFactory,
  Workflow,
  WORKFLOW_RUNNER_PLUGIN,
  WorkflowDef,
  WorkflowRunner,
} from '@letrun/core';
import { nanoid } from 'nanoid';
import { DefaultContext } from './default-context';
import { ContainerDefSchema } from './workflow-schema';
import { SystemTaskManager } from '../system-task';
import { DefaultTasksFactory } from './default-tasks-factory';
import { DefaultExecutionSession } from './default-execution-session';
import { BootstrapUtils } from '@src/libs/bootstrap-utils';

/**
 * Class representing the default runner.
 * Implements the Runner interface.
 */
export class DefaultRunner implements Runner {
  private context?: AppContext;
  private logger?: Logger;
  private isExternalContext = false;
  private abortController?: AbortController;

  static async create(context?: AppContext, logLevel?: string): Promise<Runner> {
    if (!context) {
      context = new DefaultContext();
      await context.load();
    }
    if (logLevel) {
      await BootstrapUtils.setGlobalLogLevel(context, logLevel);
    }
    const runner = new DefaultRunner();
    await runner.load(context);
    // make sure the context is unloaded when the runner is destroyed
    runner.isExternalContext = false;
    return runner;
  }

  async load(context?: AppContext): Promise<void> {
    if (!context) {
      this.context = new DefaultContext();
      await this.context.load();
    } else {
      this.context = context;
      this.isExternalContext = true;
    }

    this.logger = this.context.getLogger();
  }

  async unload(): Promise<void> {
    if (!this.isExternalContext) {
      await this.context?.unload();
    }
  }

  abort() {
    this.abortController?.abort();
  }

  async run(workflowDef: WorkflowDef | Workflow, input?: any): Promise<Workflow | undefined> {
    if (this.isWorkflowDef(workflowDef)) {
      const { error } = ContainerDefSchema.validate(workflowDef);
      if (error) {
        throw new InvalidParameterError(`Invalid workflow definition: ${error.message}`);
      }
    }

    const pluginManager = this.context?.getPluginManager();
    if (!pluginManager) {
      throw new IllegalStateError('Plugin manager not found');
    }

    this.abortController = new AbortController();

    const workflowRunner = await pluginManager.getOne<WorkflowRunner>(WORKFLOW_RUNNER_PLUGIN);
    const idGenerator = await pluginManager.getOne<IdGenerator>(ID_GENERATOR_PLUGIN);
    const tasksFactory = new DefaultTasksFactory(idGenerator, SystemTaskManager.getTaskDefValidator);
    const startTime = Date.now();
    let workflow: Workflow | undefined;

    try {
      workflow = this.prepareWorkflow(workflowDef, tasksFactory, input);

      this.logger?.info(`Executing workflow "${workflow.name}"(${workflow.id})`);

      const modifiedWorkflow = await this.firePreOrPostWorkflowRun({
        workflow,
        event: PRE_RUN_WORKFLOW_PLUGIN,
      });

      workflow = modifiedWorkflow ?? workflow;

      const result = await workflowRunner?.execute({
        workflow,
        session: new DefaultExecutionSession(
          workflow,
          tasksFactory,
          this,
          SystemTaskManager.getSystemTasks(),
          this.abortController.signal,
          this.context!,
          idGenerator,
        ),
      });
      workflow.output = result;
      workflow.status = this.abortController.signal.aborted ? 'cancelled' : 'completed';
      workflow.timeCompleted = Date.now();

      this.logger?.info(`Workflow "${workflow.name}"(${workflow.id}) is ${workflow.status}`);
      this.logger?.debug(`Workflow "${workflow.name}"(${workflow.id}) result: ${JSON.stringify(result)}`);
    } catch (e: any) {
      if (workflow) {
        workflow.status = e.name === InterruptInvokeError.name ? 'cancelled' : 'error';
        workflow.errorMessage = e.message;
      }

      if (e.name !== InterruptInvokeError.name) {
        this.logger?.error(`Error executing workflow "${workflow?.name}"(${workflow?.id}):`, e);
      } else {
        this.logger?.info(`Workflow "${workflow?.name}"(${workflow?.id}) is cancelled`);
      }
    } finally {
      if (workflow) {
        workflow.handlerDuration = Date.now() - startTime;
        workflow = await this.firePreOrPostWorkflowRun({
          workflow,
          event: POST_RUN_WORKFLOW_PLUGIN,
          result: workflow.status === 'completed' ? workflow.result : undefined,
          error: workflow.status === 'error' ? workflow.errorMessage : undefined,
        });
      }
    }

    return workflow;
  }

  private prepareWorkflow(workflowDef: WorkflowDef | Workflow, tasksFactory: TasksFactory, input?: any): Workflow {
    let workflow: Workflow | undefined;

    if (this.isWorkflowDef(workflowDef)) {
      workflow = this.createWorkflow(workflowDef, tasksFactory);
    } else {
      workflow = workflowDef;
    }

    workflow.handlerDuration = undefined;
    workflow.timeCompleted = undefined;
    workflow.timeStarted = Date.now();
    workflow.status = 'executing';

    if (input) {
      workflow.input = input;
    }
    if (!workflow.variables) {
      workflow.variables = {};
    }

    return workflow;
  }

  private async firePreOrPostWorkflowRun({
    event,
    ...rest
  }: {
    workflow: Workflow;
    event: string;
    result?: any;
    error?: any;
  }): Promise<Workflow> {
    const modifiedWorkflow = await this.context
      ?.getPluginManager()
      ?.callPluginMethod<ExecutablePlugin, Workflow | undefined>(event, 'execute', {
        ...rest,
        context: this.context,
      });
    return modifiedWorkflow ?? rest.workflow;
  }

  private isWorkflowDef(workflowDef: WorkflowDef | Workflow): workflowDef is WorkflowDef {
    return !('status' in workflowDef);
  }

  private createWorkflow(workflowDef: WorkflowDef, tasksFactory: TasksFactory): Workflow {
    const taskDefs = workflowDef.tasks ?? {};
    return {
      id: nanoid(8),
      name: workflowDef.name,
      status: 'open',
      tasks: tasksFactory.createTasks(taskDefs),
    };
  }
}
