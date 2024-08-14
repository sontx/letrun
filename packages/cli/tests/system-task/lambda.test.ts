import { AppContext, JavaScriptEngine, TaskHandlerInput } from '@letrun/core';
import fs from 'fs';
import { LambdaTaskHandler } from '@src/system-task/lambda';

const jest = import.meta.jest;

describe('LambdaTaskHandler', () => {
  let lambdaTaskHandler: LambdaTaskHandler;
  let context: AppContext;
  let loggerSpy: jest.SpyInstance;
  let javascriptEngineMock: jest.Mocked<JavaScriptEngine>;

  beforeEach(() => {
    javascriptEngineMock = {
      run: jest.fn().mockResolvedValue('result'),
    } as any;
    context = {
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue(javascriptEngineMock),
      }),
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
    } as any;
    lambdaTaskHandler = new LambdaTaskHandler();
    loggerSpy = jest.spyOn(context.getLogger(), 'debug');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('evaluates expression directly when provided', async () => {
    const taskInput: TaskHandlerInput = {
      task: { parameters: { expression: '2 + 2' } },
      context,
    } as any;
    const result = await lambdaTaskHandler.handle(taskInput);
    expect(javascriptEngineMock.run).toHaveBeenCalledWith('2 + 2', { input: undefined });
    expect(result).toBe('result');
    expect(loggerSpy).toHaveBeenCalledWith('Evaluating JavaScript expression: 2 + 2');
  });

  it('reads expression from file when file is provided', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('2 + 2');
    const taskInput: TaskHandlerInput = {
      task: { parameters: { file: 'path/to/file.js' } },
      context,
    } as any;
    const result = await lambdaTaskHandler.handle(taskInput);
    expect(javascriptEngineMock.run).toHaveBeenCalledWith('2 + 2', { input: undefined });
    expect(result).toBe('result');
    expect(loggerSpy).toHaveBeenCalledWith('Evaluating JavaScript expression: 2 + 2');
  });

  it('throws error when file does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const taskInput: TaskHandlerInput = {
      task: { parameters: { file: 'path/to/nonexistent.js' } },
      context,
    } as any;
    await expect(lambdaTaskHandler.handle(taskInput)).rejects.toThrow('File not found: path/to/nonexistent.js');
  });

  it('throws error for unsupported language', async () => {
    const taskInput: TaskHandlerInput = {
      task: { parameters: { expression: '2 + 2', language: 'python' } },
      context,
    } as any;
    await expect(lambdaTaskHandler.handle(taskInput)).rejects.toThrow('Invalid parameters: "language"');
  });

  it('validates parameters correctly', async () => {
    const taskInput: TaskHandlerInput = {
      task: { parameters: { expression: '2 + 2' } },
      context,
    } as any;
    await expect(lambdaTaskHandler.handle(taskInput)).resolves.not.toThrow();
  });
});
