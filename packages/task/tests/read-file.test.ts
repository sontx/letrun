import Handler from '@src/read-file';
import { TaskHandlerInput } from '@letrun/core';
import * as fs from 'node:fs';

const jest = import.meta.jest;

describe('ReadFileHandler', () => {
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

  it('reads file content as text', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('file content');
    mockTask.parameters = { path: 'test.txt', contentType: 'text' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toBe('file content');
  });

  it('reads file content as JSON', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('{"key": "value"}');
    mockTask.parameters = { path: 'test.json', contentType: 'json' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toEqual({ key: 'value' });
  });

  it('reads file content as lines', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('line1\nline2\nline3');
    mockTask.parameters = { path: 'test.txt', contentType: 'line' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toEqual(['line1', 'line2', 'line3']);
  });

  it('throws error if file does not exist', async () => {
    jest.spyOn(fs.promises, 'readFile').mockRejectedValue(new Error('File not found'));
    mockTask.parameters = { path: 'nonexistent.txt', contentType: 'text' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow('File not found');
  });

  it('throws error if JSON parsing fails', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('invalid json');
    mockTask.parameters = { path: 'test.json', contentType: 'json' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(SyntaxError);
  });
});
