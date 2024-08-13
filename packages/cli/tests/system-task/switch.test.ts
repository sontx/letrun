import { SwitchTaskHandler, validateSwitchTask } from '@src/system-task/switch';
import { IllegalStateError, InvalidParameterError, Task, TaskDef, TaskHandlerInput } from '@letrun/core';

const jest = import.meta.jest;

describe('SwitchTaskHandler', () => {
  let handler: SwitchTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockSession: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;

  beforeEach(() => {
    handler = new SwitchTaskHandler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue({
          run: jest.fn().mockResolvedValue('case1'),
        }),
      }),
    };
    mockSession = {
      setTasks: jest.fn(),
    };
    mockTask = {
      parameters: {},
      decisionCases: {},
      defaultCase: undefined,
    } as unknown as jest.Mocked<Task>;
  });

  it('switches to the correct case based on value evaluator', async () => {
    mockTask.parameters = { expression: 'case1', evaluatorType: 'value' };
    mockTask.decisionCases = { case1: { task1: {} } } as any;
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe('case1');
    expect(mockSession.setTasks).toHaveBeenCalledWith(mockTask, mockTask.decisionCases?.case1);
  });

  it('switches to the correct case based on javascript evaluator', async () => {
    mockTask.parameters = { expression: '"case" + 1', evaluatorType: 'javascript' };
    mockTask.decisionCases = { case1: { task1: {} } } as any;
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(mockContext.getPluginManager(), 'getOne').mockResolvedValue({
      run: jest.fn().mockImplementation(async (expression) => {
        return eval(expression);
      }),
    });
    const result = await handler.handle(input);
    expect(result).toBe('case1');
    expect(mockSession.setTasks).toHaveBeenCalledWith(mockTask, mockTask.decisionCases?.case1);
  });

  it('switches to the default case when no matching case is found', async () => {
    mockTask.parameters = { expression: 'case2', evaluatorType: 'value' };
    mockTask.defaultCase = { task1: {} } as any;
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe('case2');
    expect(mockSession.setTasks).toHaveBeenCalledWith(mockTask, mockTask.defaultCase);
  });

  it('throws error when no matching case and no default case is found', async () => {
    mockTask.parameters = { expression: 'case2', evaluatorType: 'value' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(IllegalStateError);
  });

  it('throws error for invalid evaluator type', async () => {
    mockTask.parameters = { expression: 'case1', evaluatorType: 'invalid' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(InvalidParameterError);
  });

  it('validates switch task definition with valid tasks', () => {
    const taskDef: TaskDef = {
      name: 'switchTask',
      decisionCases: { case1: { task1: {} } },
      defaultCase: { task2: {} },
    } as any;
    expect(() => validateSwitchTask(taskDef)).not.toThrow();
  });

  it('throws error for switch task definition with tasks property', () => {
    const taskDef: TaskDef = { name: 'switchTask', tasks: { task1: {} } } as any;
    expect(() => validateSwitchTask(taskDef)).toThrow(InvalidParameterError);
  });

  it('throws error for switch task definition without decisionCases or defaultCase', () => {
    const taskDef: TaskDef = { name: 'switchTask' } as any;
    expect(() => validateSwitchTask(taskDef)).toThrow(InvalidParameterError);
  });
});
