import { LogHelper } from '@src/command/libs/log-helper';

const jest = import.meta.jest;

describe('LogHelper', () => {
  it('writes error messages to stderr and forwards output to stdout', async () => {
    const context = {
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue({
          hook: jest.fn(),
        }),
      }),
    } as any;
    const fn = jest.fn().mockResolvedValue('output');
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await LogHelper.usePipeMode(context, fn);

    expect(stderrSpy).not.toHaveBeenCalled();
    expect(stdoutSpy).toHaveBeenCalledWith('output');
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  it('writes error messages to stderr and does not forward output to stdout if error occurs', async () => {
    const context = {
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue({
          hook: jest.fn((hookType, callback) => {
            if (hookType === 'pre') {
              callback('error', 'error message');
            }
          }),
        }),
      }),
    } as any;
    const fn = jest.fn().mockResolvedValue('output');
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await LogHelper.usePipeMode(context, fn);

    expect(stderrSpy).toHaveBeenCalledWith('error message');
    expect(stdoutSpy).not.toHaveBeenCalled();
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  it('does not forward undefined or null output to stdout', async () => {
    const context = {
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue({
          hook: jest.fn(),
        }),
      }),
    } as any;
    const fn = jest.fn().mockResolvedValue(undefined);
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await LogHelper.usePipeMode(context, fn);

    expect(stdoutSpy).not.toHaveBeenCalled();
    stdoutSpy.mockRestore();
  });
});
