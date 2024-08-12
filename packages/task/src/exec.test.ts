import Handler from './exec';
import { TaskHandlerInput } from '@letrun/core';

const jest = import.meta.jest;

describe('ExecHandler', () => {
  let handler: Handler;
  let mockContext: jest.Mocked<any>;
  let mockTask: jest.Mocked<any>;

  beforeEach(() => {
    handler = new Handler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        error: jest.fn(),
      }),
    };
    mockTask = {
      parameters: {},
    } as unknown as jest.Mocked<any>;
  });

  it('executes command successfully with no arguments', async () => {
    mockTask.parameters = { cmd: 'echo', args: ['Hello, World!'] };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe('Hello, World!\n');
  });

  it('executes command with arguments and returns JSON result', async () => {
    mockTask.parameters = { cmd: 'echo', args: ['{"key": "value"}'] };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toEqual({ key: 'value' });
  });

  it('handles command execution failure', async () => {
    mockTask.parameters = { cmd: 'invalid_command' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(/^Failed to start process: spawn invalid_command ENOENT*/);
  });

  it('terminates command after timeout', async () => {
    mockTask.parameters = { cmd: 'sleep', args: ['10'], timeoutMs: 100 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(/^Command timed out: 100 ms*/);
  });
});
