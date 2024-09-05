import { LogTaskHandler } from '@src/system-task/log';
import { InvalidParameterError, Task, TaskHandlerInput } from '@letrun/common';

const jest = import.meta.jest;

describe('LogTaskHandler', () => {
  let handler: LogTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;

  beforeEach(() => {
    handler = new LogTaskHandler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }),
    };
    mockTask = {
      parameters: {},
    } as unknown as jest.Mocked<Task>;
  });

  it('logs info message successfully', async () => {
    mockTask.parameters = { level: 'info', message: 'Information message' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {}, workflow: {} } as any;
    await handler.handle(input);
    expect(mockContext.getLogger().info).toHaveBeenCalledWith('Information message');
  });

  it('logs debug message successfully', async () => {
    mockTask.parameters = { level: 'debug', message: 'Debug message' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {}, workflow: {} } as any;
    await handler.handle(input);
    expect(mockContext.getLogger().debug).toHaveBeenCalledWith('Debug message');
  });

  it('logs warn message successfully', async () => {
    mockTask.parameters = { level: 'warn', message: 'Warning message' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {}, workflow: {} } as any;
    await handler.handle(input);
    expect(mockContext.getLogger().warn).toHaveBeenCalledWith('Warning message');
  });

  it('logs error message successfully', async () => {
    mockTask.parameters = { level: 'error', message: 'Error message' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {}, workflow: {} } as any;
    await handler.handle(input);
    expect(mockContext.getLogger().error).toHaveBeenCalledWith('Error message');
  });

  it('throws error for missing message parameter', async () => {
    mockTask.parameters = { level: 'info' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {}, workflow: {} } as any;
    expect(() => handler.handle(input)).toThrow(InvalidParameterError);
  });

  it('uses default log level when level is not provided', async () => {
    mockTask.parameters = { message: 'Default level message' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {}, workflow: {} } as any;
    await handler.handle(input);
    expect(mockContext.getLogger().info).toHaveBeenCalledWith('Default level message');
  });
});
