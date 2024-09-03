import Handler from '@src/expect';
import { TaskHandlerInput } from '@letrun/common';
import { expect } from 'expect';

const jest = import.meta.jest;

describe('ExpectHandler', () => {
  let handler: Handler;
  let mockContext: jest.Mocked<any>;
  let mockTask: jest.Mocked<any>;

  beforeEach(() => {
    handler = new Handler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
    };
    mockTask = {
      parameters: {},
      output: undefined,
    } as unknown as jest.Mocked<any>;
  });

  it('expects value to be true', async () => {
    mockTask.parameters = { match: 'toBeTruthy', object: true };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe(true);
  });

  it('expects value to be false', async () => {
    mockTask.parameters = { match: 'toBeFalsy', object: false };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe(true);
  });

  it('expects value to not be true', async () => {
    mockTask.parameters = { match: 'toBeTruthy', object: false, not: true };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe(true);
  });

  it('throws custom error message on failure', async () => {
    mockTask.parameters = { match: 'toBeTruthy', object: false, message: 'Custom error message' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow('Custom error message');
  });

  it('expects value to be equal', async () => {
    mockTask.parameters = { match: 'toEqual', object: 42, value: 42 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe(true);
  });

  it('expects value to be greater than', async () => {
    mockTask.parameters = { match: 'toBeGreaterThan', object: 10, value: 5 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe(true);
  });

  it('expects value to contain', async () => {
    mockTask.parameters = { match: 'toContain', object: [1, 2, 3], value: 2 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe(true);
  });
});
