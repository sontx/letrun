import { IfTaskHandler, validateIfTask } from '@src/system-task/if';
import { InvalidParameterError, Task, TaskDef, TaskHandlerInput } from '@letrun/common';

const jest = import.meta.jest;

describe('IfTaskHandler', () => {
  let handler: IfTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockSession: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;

  beforeEach(() => {
    handler = new IfTaskHandler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
    };
    mockSession = {
      setTasks: jest.fn(),
    };
    mockTask = {
      parameters: {},
      then: {},
      else: {},
    } as unknown as jest.Mocked<Task>;
  });

  it('executes then tasks when condition is true', async () => {
    mockTask.parameters = { left: 5, operator: '==', right: 5 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe(true);
    expect(mockSession.setTasks).toHaveBeenCalledWith(mockTask, mockTask.then);
  });

  it('executes else tasks when condition is false', async () => {
    mockTask.parameters = { left: 5, operator: '==', right: 10 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe(false);
    expect(mockSession.setTasks).toHaveBeenCalledWith(mockTask, mockTask.else);
  });

  it('throws error for invalid operator', async () => {
    mockTask.parameters = { left: 5, operator: 'invalid', right: 5 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(InvalidParameterError);
  });

  it('validates if task definition with valid tasks', () => {
    const taskDef: TaskDef = { name: 'ifTask', then: { task1: {} }, else: { task2: {} } } as any;
    expect(() => validateIfTask(taskDef)).not.toThrow();
  });

  it('throws error for if task definition with tasks property', () => {
    const taskDef: TaskDef = { name: 'ifTask', tasks: { task1: {} } } as any;
    expect(() => validateIfTask(taskDef)).toThrow(InvalidParameterError);
  });

  it('throws error for if task definition without then or else', () => {
    const taskDef: TaskDef = { name: 'ifTask' } as any;
    expect(() => validateIfTask(taskDef)).toThrow(InvalidParameterError);
  });
});
