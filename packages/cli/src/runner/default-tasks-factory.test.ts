import { DefaultTasksFactory } from './default-tasks-factory';
import { InvalidParameterError, Task, TaskDef } from '@letrun/core';

const jest = import.meta.jest;

describe('DefaultTasksFactory', () => {
  let factory: DefaultTasksFactory;
  let mockTaskDefValidator: jest.MockedFunction<(taskDef: TaskDef) => void>;
  let mockTaskCustomizer: jest.MockedFunction<(task: Task) => Task>;

  beforeEach(() => {
    mockTaskDefValidator = jest.fn();
    mockTaskCustomizer = jest.fn((task) => task);
    factory = new DefaultTasksFactory(mockTaskDefValidator, mockTaskCustomizer);
  });

  it('creates tasks successfully from array', () => {
    const taskDefs = [
      { name: 'task1', title: 'Task 1' },
      { name: 'task2', title: 'Task 2' },
    ] as TaskDef[];
    const tasks = factory.createTasks(taskDefs);
    expect(Object.keys(tasks)).toEqual(['task1', 'task2']);
  });

  it('creates tasks successfully from object', () => {
    const taskDefs = {
      task1: { name: 'task1', title: 'Task 1' },
      task2: { name: 'task2', title: 'Task 2' },
    } as unknown as Record<string, TaskDef>;
    const tasks = factory.createTasks(taskDefs);
    expect(Object.keys(tasks)).toEqual(['task1', 'task2']);
  });

  it('throws error for task definition without name', () => {
    const taskDefs = [{ title: 'Task 1' }] as TaskDef[];
    expect(() => factory.createTasks(taskDefs)).toThrow(InvalidParameterError);
  });

  it('throws error for duplicated task name in array', () => {
    const taskDefs = [
      { name: 'task1', title: 'Task 1' },
      { name: 'task1', title: 'Task 1 Duplicate' },
    ] as TaskDef[];
    expect(() => factory.createTasks(taskDefs)).toThrow(InvalidParameterError);
  });

  it('throws error for duplicated task name in object', () => {
    const taskDefs = [
      { name: 'task1', title: 'Task 1' },
      { name: 'task1', title: 'Task 1 Duplicate' },
    ] as unknown as TaskDef[];
    expect(() => factory.createTasks(taskDefs)).toThrow(InvalidParameterError);
  });

  it('validates task definitions', () => {
    const taskDefs = [{ name: 'task1', title: 'Task 1' }] as TaskDef[];
    factory.createTasks(taskDefs);
    expect(mockTaskDefValidator).toHaveBeenCalledWith(taskDefs[0]);
  });

  it('customizes tasks', () => {
    const taskDefs = [{ name: 'task1', title: 'Task 1' }] as TaskDef[];
    factory.createTasks(taskDefs);
    expect(mockTaskCustomizer).toHaveBeenCalled();
  });

  it('creates nested tasks successfully', () => {
    const taskDefs = [{ name: 'task1', title: 'Task 1', tasks: [{ name: 'task1.1', title: 'Task 1.1' }] }] as TaskDef[];
    const tasks = factory.createTasks(taskDefs);
    expect(tasks?.task1?.tasks).toBeDefined();
    expect(Object.keys(tasks?.task1?.tasks!)).toEqual(['task1.1']);
  });

  it('creates decision cases successfully', () => {
    const taskDefs = [
      { name: 'task1', title: 'Task 1', decisionCases: { case1: [{ name: 'task1.1', title: 'Task 1.1' }] } },
    ] as unknown as TaskDef[];
    const tasks = factory.createTasks(taskDefs);
    expect(tasks?.task1?.decisionCases).toBeDefined();
    expect(Object.keys(tasks?.task1?.decisionCases!)).toEqual(['case1']);
    expect(Object.keys(tasks?.task1?.decisionCases?.case1 ?? {})).toEqual(['task1.1']);
  });
});
