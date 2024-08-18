import { ListCommand } from '@src/command/task/list.command';
import { TaskHelper } from '@src/command/libs/task-helper';
import { SystemTaskManager } from '@letrun/engine';

const jest = import.meta.jest;

describe('ListCommand', () => {
  let listCommand: ListCommand;
  let context: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    context = {
      getConfigProvider: jest.fn(),
      getPluginManager: jest.fn().mockReturnValue({
        getAll: jest.fn().mockResolvedValue(
          new Map([
            ['type1', [{ name: 'task1' }, { name: 'task2' }]],
            ['type2', [{ name: 'task3' }]],
          ]),
        ),
      }),
    };
    listCommand = new ListCommand(context);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(TaskHelper, 'loadCustomTasksFromConfig').mockResolvedValue([
      { name: 'customTask1', path: 'path/to/customTask1' },
      { name: 'customTask2', path: 'path/to/customTask2' },
    ]);
    jest.spyOn(SystemTaskManager, 'getSystemTasks').mockReturnValue({
      task1: { name: 'task1' } as any,
      task2: { name: 'task2' } as any,
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('prints both system and custom tasks when no options are provided', async () => {
    await (listCommand as any)['doAction']({});
    expect(consoleSpy).toHaveBeenCalledWith('Total system tasks: 2');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('task1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('task2'));
    expect(consoleSpy).toHaveBeenCalledWith('\nTotal custom tasks: 2');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('customTask1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('customTask2'));
  });

  it('prints custom tasks when custom option is provided', async () => {
    await (listCommand as any)['doAction']({ custom: true });
    expect(consoleSpy).toHaveBeenCalledWith('\nTotal custom tasks: 2');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('customTask1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('customTask2'));
  });

  it('prints system tasks when system option is provided', async () => {
    await (listCommand as any)['doAction']({ system: true });
    expect(consoleSpy).toHaveBeenCalledWith('Total system tasks: 2');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('task1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('task2'));
  });
});
