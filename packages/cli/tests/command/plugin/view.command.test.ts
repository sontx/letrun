import { ViewCommand } from '@src/command/plugin/view.command';
import { Command } from 'commander';
import { EMOJIS } from '@src/ui';

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

  it('prints plugin details when plugin is found', async () => {
    await viewCommand['doAction']({ type: 'type1', name: 'plugin1' } as any);
    expect(consoleSpy).toHaveBeenCalledWith('Type: type1');
    expect(consoleSpy).toHaveBeenCalledWith('Name: plugin1');
  });

  it('prints plugin details when no name is provided', async () => {
    await viewCommand['doAction']({ type: 'type1' } as any);
    expect(consoleSpy).toHaveBeenCalledWith('Type: type1');
    expect(consoleSpy).toHaveBeenCalledWith('Name: plugin1');
  });

  it('logs an error when plugin is not found', async () => {
    context.getPluginManager().get.mockResolvedValue([]);
    await viewCommand['doAction']({ type: 'type1', name: 'nonExistentPlugin' } as any);
    expect(loggerSpy).toHaveBeenCalledWith('Plugin not found: nonExistentPlugin');
  });

  it('prints custom methods of the plugin', async () => {
    context.getPluginManager().get.mockResolvedValue([
      {
        name: 'plugin1',
        type: 'type1',
        customMethod: jest.fn(),
      },
    ]);
    await viewCommand['doAction']({ type: 'type1', name: 'plugin1' } as any);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.GEAR} customMethod`));
  });
});
