import { Command } from 'commander';
import { NpmPackage } from '@letrun/deps';
import { VersionsCommand } from '@src/command/task/versions.command';
import { EMOJIS } from '@src/ui';

const jest = import.meta.jest;

describe('VersionsCommand', () => {
  let versionsCommand: VersionsCommand;
  let program: Command;
  let npmPackageMock: jest.Mocked<NpmPackage>;

  beforeEach(() => {
    jest.resetAllMocks();

    program = new Command();
    versionsCommand = new VersionsCommand({} as any);
    npmPackageMock = new NpmPackage() as jest.Mocked<NpmPackage>;
    versionsCommand['npmPackage'] = npmPackageMock;
    jest.spyOn(npmPackageMock, 'list').mockResolvedValue([]);
  });

  it('loads the versions command', () => {
    const commandSpy = jest.spyOn(program, 'command');
    versionsCommand.load(program);
    expect(commandSpy).toHaveBeenCalledWith('versions');
  });

  it('shows versions of installed packages', async () => {
    jest.spyOn(npmPackageMock, 'list').mockResolvedValue([
      { name: 'dep1', version: '1.0.0' },
      { name: 'dep2', version: '2.0.0' },
    ]);

    const logMock = jest.spyOn(console, 'log');
    const success = await versionsCommand['doAction']();

    expect(success).toBeTruthy();
    expect(logMock).toHaveBeenCalledWith(`${EMOJIS.PACKAGE} dep1@1.0.0\n${EMOJIS.PACKAGE} dep2@2.0.0`);
  });

  it('handles errors during listing versions', async () => {
    const error = new Error('Listing failed');
    jest.spyOn(npmPackageMock, 'list').mockRejectedValue(error);

    const success = await versionsCommand['doAction']();

    expect(success).toBeFalsy();
  });

  it('shows no packages when list is empty', async () => {
    jest.spyOn(npmPackageMock, 'list').mockResolvedValue([]);

    const logMock = jest.spyOn(console, 'log');
    const success = await versionsCommand['doAction']();

    expect(logMock).toHaveBeenCalledWith('');
    expect(success).toBeTruthy();
  });
});
