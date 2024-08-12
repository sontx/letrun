import { ListCommand } from './list.command';
import { Command } from 'commander';
import { EMOJIS } from '../../ui';

const jest = import.meta.jest;

describe('ListCommand', () => {
  let listCommand: ListCommand;
  let program: Command;
  let context: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    context = {
      getPluginManager: jest.fn().mockReturnValue({
        getAll: jest.fn().mockResolvedValue(new Map([
          ['type1', [{ name: 'plugin1' }, { name: 'plugin2' }]],
          ['type2', [{ name: 'plugin3' }]]
        ]))
      })
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

  it('prints the total number of plugins and their tree structure', async () => {
    await listCommand['doAction']();
    expect(consoleSpy).toHaveBeenCalledWith('\nTotal plugins: 3\n');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.FOLDER} type1`));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.GEAR} plugin1`));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.GEAR} plugin2`));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.FOLDER} type2`));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.GEAR} plugin3`));
  });

  it('handles empty plugin map gracefully', async () => {
    context.getPluginManager().getAll.mockResolvedValue(new Map());
    await listCommand['doAction']();
    expect(consoleSpy).toHaveBeenCalledWith('\nTotal plugins: 0\n');
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.FOLDER}`));
  });

  it('handles plugins without types gracefully', async () => {
    context.getPluginManager().getAll.mockResolvedValue(new Map([['', [{ name: 'plugin1' }]]]));
    await listCommand['doAction']();
    expect(consoleSpy).toHaveBeenCalledWith('\nTotal plugins: 1\n');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.FOLDER} `));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`${EMOJIS.GEAR} plugin1`));
  });
});
