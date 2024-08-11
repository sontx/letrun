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

/**
 * Returns a record of system task handlers.
 * @returns {Record<string, TaskHandler>} A record of task handlers.
 */
export function getSystemTasks(): Record<string, TaskHandler> {
  return {
    if: new IfTaskHandler(),
    switch: new SwitchTaskHandler(),
    for: new ForTaskHandler(),
    while: new WhileTaskHandler(),
    iterate: new IterateTaskHandler(),
    catch: new CatchTaskHandler(),
    workflow: new RunWorkflowTaskHandler(),
    log: new LogTaskHandler(),
    http: new HttpTaskHandler(),
  };
}

/**
 * A map of task definition validators.
 * @type {Record<string, (taskDef: TaskDef) => void>}
 */
const TaskDefValidatorMap: Record<string, (taskDef: TaskDef) => void> = {
  if: validateIfTask,
  switch: validateSwitchTask,
  for: validateForTask,
  while: validateWhileTask,
  iterate: validateIterateTask,
  catch: validateCatchTask,
};

/**
 * Validates a task definition.
 * @param {TaskDef} taskDef - The task definition to validate.
 */
export const taskDefValidator: TaskDefValidator = (taskDef: TaskDef) => {
  TaskDefValidatorMap[taskDef.handler]?.(taskDef);
};
