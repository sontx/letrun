import { ListCommand } from '@src/command/workflow/list.command';
import { Command } from 'commander';
import { Persistence } from '@letrun/core';
import { EMOJIS } from '@src/ui';

const jest = import.meta.jest;

describe('ListCommand', () => {
  let listCommand: ListCommand;
  let program: Command;
  let context: any;
  let consoleSpy: jest.SpyInstance;
  let persistenceMock: jest.Mocked<Persistence>;
  let workflowUnitMock: jest.Mocked<any>;

  beforeEach(() => {
    persistenceMock = {
      getUnit: jest.fn(),
    } as unknown as jest.Mocked<Persistence>;
    workflowUnitMock = {
      list: jest.fn(),
      load: jest.fn(),
    };
    persistenceMock.getUnit.mockReturnValue(workflowUnitMock);

    context = {
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue(persistenceMock),
      }),
    };

    listCommand = new ListCommand(context);
    program = new Command();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('loads the list command into the program', () => {
    const spy = jest.spyOn(program, 'command');
    listCommand.load(program);
    expect(spy).toHaveBeenCalledWith('list');
  });

  it('prints the total number of workflows and their details', async () => {
    workflowUnitMock.list.mockResolvedValue(['workflow1', 'workflow2']);
    workflowUnitMock.load.mockResolvedValue({ name: 'Workflow 1' });
    await listCommand['doAction']({ max: '10', offset: '0', with: '' } as any);
    expect(consoleSpy).toHaveBeenCalledWith('\nShowing 2 workflow(s)');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.ROCKET} workflow1`));
  });

  it('handles empty workflow list gracefully', async () => {
    workflowUnitMock.list.mockResolvedValue([]);
    await listCommand['doAction']({ max: '10', offset: '0', with: '' } as any);
    expect(consoleSpy).toHaveBeenCalledWith('\nShowing 0 workflow(s)');
  });

  it('handles workflows with additional fields', async () => {
    workflowUnitMock.list.mockResolvedValue(['workflow1']);
    workflowUnitMock.load.mockResolvedValue({ name: 'Workflow 1', status: 'active' });
    await listCommand['doAction']({ max: '10', offset: '0', with: 'status' } as any);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('status: active'));
  });

  it('handles offset and max options correctly', async () => {
    workflowUnitMock.list.mockResolvedValue(['workflow1', 'workflow2', 'workflow3']);
    workflowUnitMock.load.mockResolvedValue({ name: 'Workflow 2' });
    await listCommand['doAction']({ max: '1', offset: '1', with: '' } as any);
    expect(consoleSpy).toHaveBeenCalledWith('\nShowing 1 workflow(s) out of 3');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.ROCKET} workflow2`));
  });

  it('handles errors during workflow loading gracefully', async () => {
    workflowUnitMock.list.mockResolvedValue(['workflow1']);
    workflowUnitMock.load.mockRejectedValue(new Error('Load error'));
    await expect(listCommand['doAction']({ max: '10', offset: '0', with: '' } as any)).resolves.not.toThrow();
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.ROCKET} workflow1`));
  });
});
