import { NpmPackage } from '@letrun/deps';
import { InstallCommand } from '@src/command/workflow/install.command';

const jest = import.meta.jest;

describe('InstallCommand', () => {
  let installCommand: InstallCommand;
  let npmPackageMock: jest.Mocked<NpmPackage>;
  let loggerMock: any;
  let logErrorMock: any;
  let logInfoMock: any;

  beforeEach(() => {
    jest.resetAllMocks();

    npmPackageMock = new NpmPackage() as jest.Mocked<NpmPackage>;
    logErrorMock = jest.fn();
    logInfoMock = jest.fn();
    loggerMock = jest.fn().mockReturnValue({ error: logErrorMock, info: logInfoMock });
    jest.spyOn(npmPackageMock, 'install').mockResolvedValue({} as any);
    installCommand = new InstallCommand({
      getLogger: loggerMock,
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn(),
        callPluginMethod: jest.fn(),
      }),
    } as any);
    installCommand['npmPackage'] = npmPackageMock;
  });

  it('logs an error if the workflow file is not found', async () => {
    const inputParameterMock = {
      read: jest.fn().mockRejectedValue(new Error('File not found: invalid-path')),
    };
    jest.spyOn(installCommand['context'].getPluginManager(), 'getOne').mockResolvedValue(inputParameterMock as any);
    await expect(installCommand['doAction']('invalid-path', {})).rejects.toThrow('File not found: invalid-path');
  });

  it('logs info if no dependencies to install', async () => {
    const inputParameterMock = {
      read: jest.fn().mockResolvedValue({ tasks: {} }),
    };
    jest.spyOn(installCommand['context'].getPluginManager(), 'getOne').mockResolvedValue(inputParameterMock as any);
    await installCommand['doAction']('valid-path', {});
    expect(logInfoMock).toHaveBeenCalledWith('No dependencies to install');
  });

  it('installs dependencies from workflow file', async () => {
    const inputParameterMock = {
      read: jest.fn().mockResolvedValue({
        tasks: {
          task1: { handler: 'some-package' },
        },
      }),
    };
    jest.spyOn(installCommand['context'].getPluginManager(), 'getOne').mockResolvedValue(inputParameterMock as any);
    installCommand['getScanner'] = jest.fn().mockResolvedValue({
      scan: jest.fn().mockResolvedValue([{ type: 'package', handler: { name: 'some-package' } }]),
    });
    const succeed = await installCommand['doAction']('valid-path', {});
    expect(npmPackageMock.install).toHaveBeenCalledWith('some-package', undefined);
    expect(succeed).toBeTruthy();
  });

  it('handles errors during dependency installation', async () => {
    const error = new Error('Installation failed');
    jest.spyOn(npmPackageMock, 'install').mockRejectedValue(error);
    const inputParameterMock = {
      read: jest.fn().mockResolvedValue({
        tasks: {
          task1: { handler: 'some-package' },
        },
      }),
    };
    jest.spyOn(installCommand['context'].getPluginManager(), 'getOne').mockResolvedValue(inputParameterMock as any);
    const succeed = await installCommand['doAction']('valid-path', {});
    expect(succeed).toBeFalsy();
  });

  it('handles errors during package installation', async () => {
    const error = new Error('Installation failed');
    const inputParameterMock = {
      read: jest.fn().mockResolvedValue({
        tasks: {
          task1: { handler: 'some-package' },
        },
      }),
    };
    jest.spyOn(installCommand['context'].getPluginManager(), 'getOne').mockResolvedValue(inputParameterMock as any);
    jest.spyOn(npmPackageMock, 'install').mockRejectedValue(error);
    const succeed = await installCommand['doAction']('some-package', {});
    expect(succeed).toBeFalsy();
  });

  it('handles dry-run option correctly', async () => {
    const inputParameterMock = {
      read: jest.fn().mockResolvedValue({
        tasks: {
          task1: { handler: 'some-package' },
        },
      }),
    };
    jest.spyOn(installCommand['context'].getPluginManager(), 'getOne').mockResolvedValue(inputParameterMock as any);
    installCommand['getScanner'] = jest.fn().mockResolvedValue({
      scan: jest.fn().mockResolvedValue([{ type: 'package', handler: { name: 'some-package' } }]),
    });
    const succeed = await installCommand['doAction']('valid-path', { dryRun: true });
    expect(npmPackageMock.install).toHaveBeenCalledWith('some-package', '--dry-run');
    expect(succeed).toBeTruthy();
  });
});
