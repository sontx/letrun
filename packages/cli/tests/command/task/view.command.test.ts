import { ViewCommand } from '@src/command/task/view.command';
import { Command } from 'commander';
import { EMOJIS } from '@src/ui';
import { SystemTaskManager } from '@src/system-task';
import { TaskHelper } from '@src/command/libs';

const jest = import.meta.jest;

describe('ViewCommand', () => {
  let viewCommand: ViewCommand;
  let program: Command;
  let context: any;
  let consoleSpy: jest.SpyInstance;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    context = {
      getPluginManager: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue([{ name: 'plugin1', type: 'type1' }]),
      }),
      getLogger: jest.fn().mockReturnValue({
        error: jest.fn(),
        warn: jest.fn(),
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

  it('views a system task', async () => {
    const systemTask = { name: 'systemTask1', group: 'group1', description: 'A system task' };
    jest.spyOn(SystemTaskManager, 'getSystemTasks').mockReturnValue({ systemTask1: systemTask } as any);

    await viewCommand['doAction']('systemTask1', {});

    expect(consoleSpy).toHaveBeenCalledWith(`${EMOJIS.NUT_AND_BOLT} systemTask1`);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('group: group1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('description: A system task'));
  });

  it('views a custom task', async () => {
    const customTask = { name: 'customTask1', group: 'group1', description: 'A custom task' };
    jest.spyOn(TaskHelper, 'loadCustomTasksFromConfig').mockResolvedValue([customTask]);
    jest.spyOn(TaskHelper, 'searchTasks').mockReturnValue([customTask]);

    await viewCommand['doAction']('customTask1', {});

    expect(consoleSpy).toHaveBeenCalledWith(`${EMOJIS.ROBOT} customTask1`);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('group: group1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('description: A custom task'));
  });

  it('logs an error when task is not found', async () => {
    jest.spyOn(TaskHelper, 'loadCustomTasksFromConfig').mockResolvedValue([]);
    jest.spyOn(TaskHelper, 'searchTasks').mockReturnValue([]);

    await viewCommand['doAction']('nonExistentTask', {});

    expect(loggerSpy).toHaveBeenCalledWith('Task "nonExistentTask" not found');
  });

  it('warns when multiple tasks with the same name and different groups are found', async () => {
    const customTasks = [
      { name: 'customTask1', group: 'group1' },
      { name: 'customTask1', group: 'group2' },
    ];
    jest.spyOn(TaskHelper, 'loadCustomTasksFromConfig').mockResolvedValue(customTasks);
    jest.spyOn(TaskHelper, 'searchTasks').mockReturnValue(customTasks);

    await viewCommand['doAction']('customTask1', {});

    expect(context.getLogger().warn).toHaveBeenCalledWith('Multiple tasks found with name "customTask1", please specify the group.');
  });

  it('warns when multiple tasks with the same name and same group are found', async () => {
    const customTasks = [
      { name: 'customTask1', group: 'group1' },
      { name: 'customTask1', group: 'group1' },
    ];
    jest.spyOn(TaskHelper, 'loadCustomTasksFromConfig').mockResolvedValue(customTasks);
    jest.spyOn(TaskHelper, 'searchTasks').mockReturnValue(customTasks);

    await viewCommand['doAction']('customTask1', {});

    expect(context.getLogger().warn).toHaveBeenCalledWith('Multiple tasks found with name "customTask1" with the same group group1, we do not recommend this.');
  });
});
