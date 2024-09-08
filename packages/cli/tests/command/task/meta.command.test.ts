import { Command } from 'commander';
import { SystemTaskManager } from '@letrun/engine';
import fs from 'fs';
import { MetaCommand } from '@src/command/task/meta.command';
import { defaultTaskHandlerParser } from '@letrun/core';
import { SYSTEM_TASK_GROUP } from '@letrun/common';

const jest = import.meta.jest;

describe('MetaCommand', () => {
  let metaCommand: MetaCommand;
  let program: Command;
  let context: any;

  beforeEach(() => {
    jest.resetAllMocks();
    context = { getPluginManager: jest.fn() };
    metaCommand = new MetaCommand(context);
    program = new Command();
  });

  it('loads the meta command', () => {
    metaCommand.load(program);
    expect(program.commands[0]?.name()).toBe('meta');
  });

  it('extracts metadata from a system task', async () => {
    const mockTaskHandler = { name: 'mockTask', handle: () => {} };
    const mockGetSystemTasks = jest
      .spyOn(SystemTaskManager, 'getSystemTasks')
      .mockReturnValue({ mockTask: mockTaskHandler });
    const mockExtractor = { extract: jest.fn().mockResolvedValue('metadata') };
    context.getPluginManager.mockReturnValue({ getOne: jest.fn().mockResolvedValue(mockExtractor) });

    const result = await (metaCommand as any).doAction('mockTask');
    expect(result).toBe('metadata');
    mockGetSystemTasks.mockReset();
  });

  it('extracts metadata from a file path', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: jest.fn().mockReturnValue(true) } as any);

    const mockExtractor = { extract: jest.fn().mockResolvedValue('metadata') };
    context.getPluginManager.mockReturnValue({ getOne: jest.fn().mockResolvedValue(mockExtractor) });

    const result = await (metaCommand as any).doAction('mockPath');
    expect(result).toBe('metadata');
  });

  it('extracts metadata from a package', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mockExtractor = { extract: jest.fn().mockResolvedValue('metadata') };
    const mockParsedHandler = { name: 'mockPackage', type: 'package' };
    const mockPluginManager = {
      getOne: jest.fn().mockResolvedValue(mockExtractor),
      callPluginMethod: jest.fn().mockResolvedValue('mockLocation'),
    };
    context.getPluginManager.mockReturnValue(mockPluginManager);
    jest.spyOn(defaultTaskHandlerParser, 'parse').mockReturnValue(mockParsedHandler as any);

    const result = await (metaCommand as any).doAction('mockPackage');
    expect(result).toBe('metadata');
  });

  it('installs package if not found', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mockExtractor = { extract: jest.fn().mockResolvedValue('metadata') };
    const mockParsedHandler = { name: 'mockPackage', type: 'package' };
    const mockPluginManager = {
      getOne: jest.fn().mockResolvedValue(mockExtractor),
      callPluginMethod: jest.fn().mockResolvedValue(null),
    };
    context.getPluginManager.mockReturnValue(mockPluginManager);
    jest.spyOn(defaultTaskHandlerParser, 'parse').mockReturnValue(mockParsedHandler as any);
    jest.spyOn(metaCommand as any, 'installPackage').mockResolvedValue(true);

    const result = await (metaCommand as any).doAction('mockPackage');
    expect(result).toBe('metadata');
  });

  it('throws error if package cannot be found or installed', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mockExtractor = { extract: jest.fn().mockResolvedValue('metadata') };
    const mockParsedHandler = { name: 'mockPackage', type: 'package' };
    const mockPluginManager = {
      getOne: jest.fn().mockResolvedValue(mockExtractor),
      callPluginMethod: jest.fn().mockResolvedValue(null),
    };
    context.getPluginManager.mockReturnValue(mockPluginManager);
    jest.spyOn(defaultTaskHandlerParser, 'parse').mockReturnValue(mockParsedHandler as any);
    jest.spyOn(metaCommand as any, 'installPackage').mockResolvedValue(false);

    await expect((metaCommand as any).doAction('mockPackage')).rejects.toThrow('Cannot find module: mockPackage');
  });

  it('writes metadata to output file if output option is provided', async () => {
    const mockMetadata = { key: 'value' };
    const mockExtractor = { extract: jest.fn().mockResolvedValue(mockMetadata) };
    const mockWriteFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    const mockPluginManager = {
      getOne: jest.fn().mockResolvedValue(mockExtractor),
      callPluginMethod: jest.fn().mockResolvedValue('mockLocation'),
    };
    context.getPluginManager.mockReturnValue(mockPluginManager);

    await (metaCommand as any).doAction('mockTask', { output: 'output.json' });

    expect(mockWriteFile).toHaveBeenCalledWith('output.json', JSON.stringify(mockMetadata, null, 2), 'utf8');
  });

  it('extracts metadata for all system tasks when name is not provided', async () => {
    const mockSystemTasks = { task1: { name: 'task1' }, task2: { name: 'task2' } } as any;
    const mockExtractor = { extract: jest.fn().mockResolvedValue('metadata') };
    jest.spyOn(SystemTaskManager, 'getSystemTasks').mockReturnValue(mockSystemTasks);
    context.getPluginManager.mockReturnValue({ getOne: jest.fn().mockResolvedValue(mockExtractor) });

    const result = await (metaCommand as any).doAction();

    expect(result).toBe('metadata');
    expect(mockExtractor.extract).toHaveBeenCalledWith({
      ...SYSTEM_TASK_GROUP,
      tasks: mockSystemTasks,
    });
  });
});
