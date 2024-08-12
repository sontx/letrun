import {
  countTasks,
  ExecutionSession,
  InvalidParameterError,
  isWorkflowTaskDefsEmpty,
  scanAllTasks,
  Task,
  TaskDef,
} from '@letrun/core';

/**
 * Validates the loop task definition.
 * @param {string} taskName - The name of the task.
 * @returns {Function} A function that validates the task definition.
 * @throws {InvalidParameterError} If the task definition is invalid.
 */
export function validateLoopTask(taskName: string): Function {
  return (taskDef: TaskDef) => {
    if (!isWorkflowTaskDefsEmpty(taskDef.tasks)) {
      throw new InvalidParameterError(
        `'${taskName}' task ${taskDef.name} cannot have nested tasks, use the 'loopOver' property instead`,
      );
    }
    if (isWorkflowTaskDefsEmpty(taskDef.loopOver)) {
      throw new InvalidParameterError(`'${taskName}' task ${taskDef.name} must have a 'loopOver' property`);
    }
  };
}

/**
 * Initializes a new iteration for the loop task.
 * @param {Task} task - The task to initialize a new iteration for.
 * @param {ExecutionSession} session - The execution session.
 */
export function initNewIteration(task: Task, session: ExecutionSession) {
  if (!task.loopOver) {
    task.loopOver = [];
  }
  if (countTasks(task.tasks) > 0) {
    task.loopOver.push(...Object.keys(task.tasks!).map((key) => task.tasks![key]!));
  }

  const newTasks = session.tasksFactory.createTasks(task.taskDef.loopOver ?? {}, task.id);
  scanAllTasks(newTasks, true, (newTask) => {
    newTask.runtimeName = `${newTask.runtimeName}__${task.output.iteration}`;
    return true;
  });
  session.setTasks(task, newTasks);
}
