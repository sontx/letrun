import {
  AppContext,
  ExecutablePlugin,
  IllegalStateError,
  InvalidParameterError,
  Logger,
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
import { getSystemTasks, taskDefValidator } from '../system-task';
import { DefaultTasksFactory } from './default-tasks-factory';
import { DefaultExecutionSession } from './default-execution-session';

const POST_WORKFLOW_RUN = 'post-workflow-run';
const PRE_WORKFLOW_RUN = 'pre-workflow-run';

/**
 * Class representing the default runner.
 * Implements the Runner interface.
 */
export class DefaultRunner implements Runner {
  private context?: AppContext;
  private logger?: Logger;
  private isExternalContext = false;

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

    const workflowRunner = await pluginManager.getOne<WorkflowRunner>(WORKFLOW_RUNNER_PLUGIN);
    const tasksFactory = new DefaultTasksFactory(taskDefValidator);
    const startTime = Date.now();
    let workflow: Workflow | undefined;

    try {
      workflow = this.prepareWorkflow(workflowDef, tasksFactory, input);

      this.logger?.info(`Executing workflow "${workflow.name}"(${workflow.id})`);

      const modifiedWorkflow = await this.firePreOrPostWorkflowRun({
        workflow,
        event: PRE_WORKFLOW_RUN,
      });

      workflow = modifiedWorkflow ?? workflow;

      const result = await workflowRunner?.execute({
        workflow,
        session: new DefaultExecutionSession(workflow, tasksFactory, this, getSystemTasks(), this.context!),
      });
      workflow.output = result;

      this.logger?.info(`Workflow "${workflow.name}"(${workflow.id}) completed`);
      this.logger?.debug(`Workflow "${workflow.name}"(${workflow.id}) result: ${JSON.stringify(result)}`);

      workflow.status = 'completed';
      workflow.timeCompleted = Date.now();
    } catch (e: any) {
      if (workflow) {
        workflow.status = 'error';
        workflow.errorMessage = e.message;
      }

      this.logger?.error(`Error executing workflow "${workflow?.name}"(${workflow?.id}):`, e);
    } finally {
      if (workflow) {
        workflow.handlerDuration = Date.now() - startTime;
        workflow = await this.firePreOrPostWorkflowRun({
          workflow,
          event: POST_WORKFLOW_RUN,
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
