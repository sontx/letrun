import { TaskDef, TaskHandler } from '@letrun/core';
import { IfTaskHandler, validateIfTask } from './if';
import { SwitchTaskHandler, validateSwitchTask } from './switch';
import { ForTaskHandler, validateForTask } from './for';
import { validateWhileTask, WhileTaskHandler } from './while';
import { CatchTaskHandler, validateCatchTask } from './catch';
import { RunWorkflowTaskHandler } from './run-workflow';
import { TaskDefValidator } from '../runner/default-tasks-factory';
import { LogTaskHandler } from './log';
import { HttpTaskHandler } from './http';
import { IterateTaskHandler, validateIterateTask } from './iterate';
import { LambdaTaskHandler } from '@src/system-task/lambda';

export class SystemTaskManager {
  private static systemTasks: Record<string, TaskHandler> = {
    if: new IfTaskHandler(),
    switch: new SwitchTaskHandler(),
    for: new ForTaskHandler(),
    while: new WhileTaskHandler(),
    iterate: new IterateTaskHandler(),
    catch: new CatchTaskHandler(),
    workflow: new RunWorkflowTaskHandler(),
    log: new LogTaskHandler(),
    http: new HttpTaskHandler(),
    lambda: new LambdaTaskHandler(),
  };
  private static taskDefValidatorMap: Record<string, TaskDefValidator> = {
    if: validateIfTask,
    switch: validateSwitchTask,
    for: validateForTask,
    while: validateWhileTask,
    iterate: validateIterateTask,
    catch: validateCatchTask,
  };

  static getSystemTasks(): Record<string, TaskHandler> {
    return { ...this.systemTasks };
  }

  static getTaskDefValidator(): TaskDefValidator {
    return (taskDef: TaskDef) => {
      this.taskDefValidatorMap[taskDef.handler]?.(taskDef);
    };
  }
}
