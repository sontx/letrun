import { DeleteCommand } from '@src/command/workflow/delete.command';
import { Command } from 'commander';
import { Persistence } from '@letrun/core';

const jest = import.meta.jest;

describe('DeleteCommand', () => {
  let deleteCommand: DeleteCommand;
  let program: Command;
  let persistenceMock: jest.Mocked<Persistence>;
  let workflowUnitMock: jest.Mocked<any>;

  beforeEach(() => {
    program = new Command();
    persistenceMock = {
      getUnit: jest.fn(),
    } as unknown as jest.Mocked<Persistence>;
    workflowUnitMock = {
      remove: jest.fn(),
    };
    persistenceMock.getUnit.mockReturnValue(workflowUnitMock);
    deleteCommand = new DeleteCommand({
      getPluginManager: jest.fn().mockReturnValue({ getOne: jest.fn().mockResolvedValue(persistenceMock) }),
      getLogger: jest.fn().mockReturnValue({ error: jest.fn() }),
    } as any);
  });

  it('loads the delete command into the program', () => {
    const spy = jest.spyOn(program, 'command');
    deleteCommand.load(program);
    expect(spy).toHaveBeenCalledWith('delete');
  });

  it('deletes a workflow successfully', async () => {
    await deleteCommand['doAction']('workflow1');
    expect(workflowUnitMock.remove).toHaveBeenCalledWith('workflow1');
  });

  it('handles errors during workflow deletion', async () => {
    workflowUnitMock.remove.mockRejectedValue(new Error('Deletion error'));
    await expect(deleteCommand['doAction']('workflow1')).resolves.not.toThrow();
    expect(workflowUnitMock.remove).toHaveBeenCalledWith('workflow1');
  });
});
