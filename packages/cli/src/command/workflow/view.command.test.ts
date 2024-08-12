import { ViewCommand } from './view.command';
import { Command } from 'commander';
import { Persistence } from '@letrun/core/dist';
import fs from 'fs';

const jest = import.meta.jest;

describe('ViewCommand', () => {
  let viewCommand: ViewCommand;
  let program: Command;
  let context: any;
  let consoleSpy: jest.SpyInstance;
  let loggerSpy: jest.SpyInstance;
  let persistenceMock: jest.Mocked<Persistence>;
  let workflowUnitMock: jest.Mocked<any>;

  beforeEach(() => {
    persistenceMock = {
      getUnit: jest.fn(),
    } as unknown as jest.Mocked<Persistence>;
    workflowUnitMock = {
      load: jest.fn(),
    };
    persistenceMock.getUnit.mockReturnValue(workflowUnitMock);

    context = {
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue(persistenceMock),
      }),
      getLogger: jest.fn().mockReturnValue({
        error: jest.fn(),
      }),
    };

    viewCommand = new ViewCommand(context);
    program = new Command();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    loggerSpy = jest.spyOn(context.getLogger(), 'error');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    loggerSpy.mockRestore();
  });

  it('loads the view command into the program', () => {
    const spy = jest.spyOn(program, 'command');
    viewCommand.load(program);
    expect(spy).toHaveBeenCalledWith('view');
  });

  it('prints workflow details when workflow is found by path', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ name: 'Workflow 1' }));
    await viewCommand['doAction']('path/to/workflow', { with: '' } as any);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Workflow Definition: Workflow 1'));
  });

  it('prints workflow details when workflow is found by id', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    workflowUnitMock.load.mockResolvedValue({ name: 'Workflow 1' });
    await viewCommand['doAction']('workflowId', { with: '' } as any);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Workflow Definition: Workflow 1'));
  });

  it('logs an error when workflow is not found by id', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    workflowUnitMock.load.mockResolvedValue(undefined);
    await viewCommand['doAction']('nonExistentWorkflowId', { with: '' } as any);
    expect(loggerSpy).toHaveBeenCalledWith('Workflow not found: nonExistentWorkflowId');
  });

  it('prints additional fields when specified', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    workflowUnitMock.load.mockResolvedValue({ name: 'Workflow 1', status: 'active' });
    await viewCommand['doAction']('workflowId', { with: 'status' } as any);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('status: active'));
  });

  it('prints tasks view with total number of tasks', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    workflowUnitMock.load.mockResolvedValue({
      name: 'Workflow 1',
      tasks: [{ name: 'Task 1' }, { name: 'Task 2' }],
    });
    await viewCommand['doAction']('workflowId', { with: '' } as any);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Tasks view: 2 task(s)'));
  });

  it('handles errors during workflow loading gracefully', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    workflowUnitMock.load.mockRejectedValue(new Error('Load error'));
    await expect(viewCommand['doAction']('workflowId', { with: '' } as any)).resolves.not.toThrow();
    expect(loggerSpy).toHaveBeenCalledWith(`Failed to load workflow: Load error`);
  });
});
