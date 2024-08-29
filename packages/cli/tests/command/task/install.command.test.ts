import { Command } from 'commander';
import { NpmPackage } from '@letrun/deps';
import { InstallCommand } from '@src/command/task/install.command';

const jest = import.meta.jest;

describe('InstallCommand', () => {
  let installCommand: InstallCommand;
  let program: Command;
  let npmPackageMock: jest.Mocked<NpmPackage>;

  beforeEach(() => {
    jest.resetAllMocks();

    program = new Command();
    npmPackageMock = new NpmPackage() as jest.Mocked<NpmPackage>;
    jest.spyOn(npmPackageMock, 'install').mockResolvedValue({} as any);
    installCommand = new InstallCommand({} as any);
    installCommand['npmPackage'] = npmPackageMock;
  });

  it('loads the install command', () => {
    const commandSpy = jest.spyOn(program, 'command');
    installCommand.load(program);
    expect(commandSpy).toHaveBeenCalledWith('install');
  });

  it('installs a specific package', async () => {
    const succeed = await installCommand['doAction']('some-package');
    expect(npmPackageMock.install).toHaveBeenCalledWith('some-package');
    expect(succeed).toBeTruthy();
  });

  it('installs all packages when no package name is provided', async () => {
    const succeed = await installCommand['doAction']();
    expect(npmPackageMock.install).toHaveBeenCalledWith(undefined);
    expect(succeed).toBeTruthy();
  });

  it('handles errors during package installation', async () => {
    const error = new Error('Installation failed');
    jest.spyOn(npmPackageMock, 'install').mockRejectedValue(error);
    const succeed = await installCommand['doAction']('some-package');
    expect(succeed).toBeFalsy();
  });
});
