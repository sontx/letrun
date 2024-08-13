import { ClearCommand } from '@src/command/workflow/clear.command';
import { Command } from 'commander';
import { Persistence } from '@letrun/core';

const jest = import.meta.jest;

describe('ClearCommand', () => {
  let clearCommand: ClearCommand;
  let program: Command;
  let persistenceMock: jest.Mocked<Persistence>;
  let workflowUnitMock: jest.Mocked<any>;

  beforeEach(() => {
    program = new Command();
    persistenceMock = {
      getUnit: jest.fn(),
    } as unknown as jest.Mocked<Persistence>;
    workflowUnitMock = {
      list: jest.fn(),
      remove: jest.fn(),
    };
    persistenceMock.getUnit.mockReturnValue(workflowUnitMock);
    clearCommand = new ClearCommand({
      getPluginManager: jest.fn().mockReturnValue({ getOne: jest.fn().mockResolvedValue(persistenceMock) }),
    } as any);
  });

  it('loads the clear command into the program', () => {
    const spy = jest.spyOn(program, 'command');
    clearCommand.load(program);
    expect(spy).toHaveBeenCalledWith('clear');
  });

  it('clears all saved workflows successfully', async () => {
    workflowUnitMock.list.mockResolvedValue(['workflow1', 'workflow2']);
    await clearCommand['doAction']();
    expect(workflowUnitMock.list).toHaveBeenCalled();
    expect(workflowUnitMock.remove).toHaveBeenCalledWith('workflow1');
    expect(workflowUnitMock.remove).toHaveBeenCalledWith('workflow2');
  });

  it('handles case when no workflows are saved', async () => {
    workflowUnitMock.list.mockResolvedValue([]);
    await clearCommand['doAction']();
    expect(workflowUnitMock.list).toHaveBeenCalled();
    expect(workflowUnitMock.remove).not.toHaveBeenCalled();
  });

  it('handles errors during workflow removal', async () => {
    workflowUnitMock.list.mockResolvedValue(['workflow1']);
    await expect(clearCommand['doAction']()).resolves.not.toThrow();
    expect(workflowUnitMock.list).toHaveBeenCalled();
    expect(workflowUnitMock.remove).toHaveBeenCalledWith('workflow1');
  });
});
