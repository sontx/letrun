import { AppContext, TaskHandlerInput } from '@letrun/core';
import fs from 'fs';
import { LambdaTaskHandler } from '@src/system-task/lambda';

const jest = import.meta.jest;

describe('LambdaTaskHandler', () => {
  let lambdaTaskHandler: LambdaTaskHandler;
  let context: AppContext;
  let javascriptEngineMock: any;

  beforeEach(() => {
    lambdaTaskHandler = new LambdaTaskHandler();
    javascriptEngineMock = {
      name: 'javascript',
      run: jest.fn().mockResolvedValue('result'),
      support: jest.fn(ex => ex === 'js'),
    };
    context = {
      getPluginManager: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue([javascriptEngineMock]),
      }),
    } as any;
  });

  it('evaluates expression with input parameter', async () => {
    const taskInput: TaskHandlerInput = {
      task: { parameters: { expression: 'input.a + input.b', input: { a: 1, b: 2 } } },
      context,
    } as any;
    const result = await lambdaTaskHandler.handle(taskInput);
    expect(javascriptEngineMock.run).toHaveBeenCalledWith('input.a + input.b', { input: { a: 1, b: 2 } });
    expect(result).toBe('result');
  });

  it('evaluates expression with specified language', async () => {
    const pythonEngineMock = {
      name: 'python',
      run: jest.fn().mockResolvedValue('python result'),
    } as any;
    context.getPluginManager().get = jest.fn().mockResolvedValue([pythonEngineMock]);
    const taskInput: TaskHandlerInput = {
      task: { parameters: { expression: '2 + 2', language: 'python' } },
      context,
    } as any;
    const result = await lambdaTaskHandler.handle(taskInput);
    expect(pythonEngineMock.run).toHaveBeenCalledWith('2 + 2', { input: undefined });
    expect(result).toBe('python result');
  });

  it('reads expression from valid file path', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('2 + 2');
    const taskInput: TaskHandlerInput = {
      task: { parameters: { file: 'path/to/file.js' } },
      context,
    } as any;
    const result = await lambdaTaskHandler.handle(taskInput);
    expect(javascriptEngineMock.run).toHaveBeenCalledWith('2 + 2', { input: undefined });
    expect(result).toBe('result');
  });

  it('throws error for invalid file path', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const taskInput: TaskHandlerInput = {
      task: { parameters: { file: 'path/to/nonexistent.js' } },
      context,
    } as any;
    await expect(lambdaTaskHandler.handle(taskInput)).rejects.toThrow('File not found: path/to/nonexistent.js');
  });

  it('throws error when neither expression nor file is provided', async () => {
    const taskInput: TaskHandlerInput = {
      task: { parameters: {} },
      context,
    } as any;
    await expect(lambdaTaskHandler.handle(taskInput)).rejects.toThrow("Invalid parameters: \"value\" must contain at least one of [expression, file]");
  });

  it('throws error when no script engine is found for specified language', async () => {
    context.getPluginManager().get = jest.fn().mockResolvedValue([]);
    const taskInput: TaskHandlerInput = {
      task: { parameters: { expression: '2 + 2', language: 'nonexistent' } },
      context,
    } as any;
    await expect(lambdaTaskHandler.handle(taskInput)).rejects.toThrow('No script engine found for language: nonexistent');
  });

  it('throws error when no script engine is found for specified file extension', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('2 + 2');
    context.getPluginManager().get = jest.fn().mockResolvedValue([]);
    const taskInput: TaskHandlerInput = {
      task: { parameters: { file: 'path/to/file.nonexistent' } },
      context,
    } as any;
    await expect(lambdaTaskHandler.handle(taskInput)).rejects.toThrow('No script engine found for file extension: nonexistent');
  });
});
