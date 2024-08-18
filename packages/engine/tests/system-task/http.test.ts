import { HttpTaskHandler } from '@src/system-task/http';
import { InvalidParameterError, Task, TaskHandlerInput } from '@letrun/core';

const jest = import.meta.jest;

describe('HttpTaskHandler', () => {
  let handler: HttpTaskHandler;
  let mockTask: jest.Mocked<Task>;

  beforeEach(() => {
    handler = new HttpTaskHandler();
    mockTask = {
      parameters: {},
    } as unknown as jest.Mocked<Task>;
  });

  it('sends GET request successfully', async () => {
    mockTask.parameters = { url: 'https://api.example.com/data', method: 'GET' };
    const input: TaskHandlerInput = { task: mockTask, context: {}, session: {}, workflow: {} as any } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    const result = await handler.handle(input);
    expect(result).toEqual({ success: true });
  });

  it('sends POST request with body successfully', async () => {
    mockTask.parameters = { url: 'https://api.example.com/data', method: 'POST', body: { key: 'value' } };
    const input: TaskHandlerInput = { task: mockTask, context: {}, session: {}, workflow: {} as any } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    const result = await handler.handle(input);
    expect(result).toEqual({ success: true });
  });

  it('throws error for invalid URL', async () => {
    mockTask.parameters = { url: 'invalid-url', method: 'GET' };
    const input: TaskHandlerInput = { task: mockTask, context: {}, session: {}, workflow: {} as any } as any;
    await expect(handler.handle(input)).rejects.toThrow(InvalidParameterError);
  });

  it('throws error for unsupported response type', async () => {
    mockTask.parameters = { url: 'https://api.example.com/data', method: 'GET', responseType: 'unsupported' };
    const input: TaskHandlerInput = { task: mockTask, context: {}, session: {}, workflow: {} as any } as any;
    await expect(handler.handle(input)).rejects.toThrow(InvalidParameterError);
  });

  it('handles request timeout', async () => {
    mockTask.parameters = { url: 'https://api.example.com/data', method: 'GET', timeoutMs: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: {}, session: {}, workflow: {} as any } as any;
    global.fetch = jest
      .fn()
      .mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2)));
    await expect(handler.handle(input)).rejects.toThrow('Timeout');
  });

  it('appends query parameters to URL', async () => {
    mockTask.parameters = { url: 'https://api.example.com/data', method: 'GET', params: { key: 'value' } };
    const input: TaskHandlerInput = { task: mockTask, context: {}, session: {}, workflow: {} as any } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    await handler.handle(input);
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data?key=value', expect.anything());
  });

  it('throws error for HTTP request failure', async () => {
    mockTask.parameters = { url: 'https://api.example.com/data', method: 'GET' };
    const input: TaskHandlerInput = { task: mockTask, context: {}, session: {}, workflow: {} as any } as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    await expect(handler.handle(input)).rejects.toThrow('HTTP request failed with status 500');
  });

  it('aborts while requesting', async () => {
    const abortController = new AbortController();
    mockTask.parameters = { url: 'https://api.example.com/data', method: 'GET' };
    const input: TaskHandlerInput = { task: mockTask, context: {}, session: { signal: abortController.signal }, workflow: {} as any } as any;

    global.fetch = jest.fn().mockImplementation(() => new Promise((_, reject) => {
      abortController.abort();
      reject(new Error('The operation was aborted.'));
    }));

    await expect(handler.handle(input)).rejects.toThrow('The operation was aborted.');
    expect(global.fetch).toHaveBeenCalled();
  });
});
