import Handler from './write-file';
import { TaskHandlerInput } from '@letrun/core';
import * as fs from 'node:fs';

const jest = import.meta.jest;

describe('WriteFileHandler', () => {
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

  it('writes string content to file', async () => {
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    mockTask.parameters = { path: 'test.txt', content: 'Hello, World!' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await handler.handle(input);
    expect(fs.promises.writeFile).toHaveBeenCalledWith('test.txt', 'Hello, World!', { flag: 'w' });
  });

  it('writes JSON content to file', async () => {
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    mockTask.parameters = { path: 'test.json', content: { key: 'value' } };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await handler.handle(input);
    expect(fs.promises.writeFile).toHaveBeenCalledWith('test.json', JSON.stringify({ key: 'value' }, null, 2), {
      flag: 'w',
    });
  });

  it('appends content to file', async () => {
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    mockTask.parameters = { path: 'test.txt', content: 'Appended content', append: true };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await handler.handle(input);
    expect(fs.promises.writeFile).toHaveBeenCalledWith('test.txt', 'Appended content', { flag: 'a' });
  });

  it('throws error if write fails', async () => {
    jest.spyOn(fs.promises, 'writeFile').mockRejectedValue(new Error('Write failed'));
    mockTask.parameters = { path: 'test.txt', content: 'Hello, World!' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: {} as any, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow('Write failed');
  });
});
