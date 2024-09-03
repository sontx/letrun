import { IdGenerator, isWorkflowTaskDefsArray, isWorkflowTaskDefsEmpty } from '@letrun/core';
import { InvalidParameterError, Task, TaskDef, TasksFactory, WorkflowTaskDefs, WorkflowTasks } from '@letrun/common';

export type TaskCustomizer = (task: Task) => Task;
export type TaskDefValidator = (taskDef: TaskDef) => void;

export class DefaultTasksFactory implements TasksFactory {
  private readonly createdTaskNames = new Set<string>();

  constructor(
    private idGenerator: IdGenerator,
    private taskDefValidator?: TaskDefValidator,
    private taskCustomizer?: TaskCustomizer,
  ) {}

  createTasks(taskDefs: WorkflowTaskDefs, parentId?: string) {
    return isWorkflowTaskDefsArray(taskDefs)
      ? taskDefs.reduce((acc, taskDef) => {
          if (!taskDef.name) {
            throw new InvalidParameterError(`Task definition ${taskDef.title} must have a name`);
          }
          if (acc[taskDef.name]) {
            throw new InvalidParameterError(`Task name ${taskDef.name} is duplicated`);
          }
          const task = this.createTask(taskDef.name, this.idGenerator.generateId(parentId), taskDef);
          task.blocking = true;
          acc[taskDef.name] = task;
          return acc;
        }, {} as WorkflowTasks)
      : Object.keys(taskDefs ?? {}).reduce((acc, key) => {
          acc[key] = this.createTask(key, this.idGenerator.generateId(parentId), taskDefs[key]!);
          return acc;
        }, {} as WorkflowTasks);
  }

  private createTask(name: string, id: string, taskDef: TaskDef): Task {
    if (this.createdTaskNames.has(name)) {
      throw new InvalidParameterError(`Task name ${name} is duplicated`);
    }
    this.createdTaskNames.add(name);

    this.taskDefValidator?.(taskDef);

    const task: Task = {
      runtimeName: name,
      id,
      status: 'waiting',
      taskDef,
      output: {},
      blocking: false,
      tasks: this.createTasks(taskDef.tasks ?? {}, id),
      then: taskDef.then ? this.createTasks(taskDef.then, id) : undefined,
      else: taskDef.else ? this.createTasks(taskDef.else, id) : undefined,
      defaultCase: taskDef.defaultCase ? this.createTasks(taskDef.defaultCase, id) : undefined,
      decisionCases: taskDef.decisionCases ? this.createDecisionCases(taskDef.decisionCases, id) : undefined,
      catch: taskDef.catch ? this.createTasks(taskDef.catch, id) : undefined,
      finally: taskDef.finally ? this.createTasks(taskDef.finally, id) : undefined,
    };
    return this.taskCustomizer ? this.taskCustomizer(task) : task;
  }

  private createDecisionCases(decisionCases: Record<string, WorkflowTaskDefs>, parentId: string) {
    return Object.keys(decisionCases).reduce(
      (acc, caseValue) => {
        if (!isWorkflowTaskDefsEmpty(decisionCases[caseValue])) {
          acc[caseValue] = this.createTasks(decisionCases[caseValue]!, parentId);
        }
        return acc;
      },
      {} as Record<string, WorkflowTasks>,
    );
  }
}
