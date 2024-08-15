import { RunCommand } from '@src/command/run.command';
import { DefaultRunner } from '@src/runner';
import { INPUT_PARAMETER_PLUGIN, Persistence, PERSISTENCE_PLUGIN } from '@letrun/core';
import { Command } from 'commander';
import fs from 'fs';
import { LogHelper } from '@src/command/libs/log-helper';

const jest = import.meta.jest;

describe('RunCommand', () => {
  let runCommand: RunCommand;
  let context: any;
  let consoleSpy: jest.SpyInstance;
  let loggerSpy: jest.SpyInstance;
  let runnerMock: jest.Mocked<DefaultRunner>;
  let persistenceMock: jest.Mocked<Persistence>;
  let inputParameterMock: jest.Mocked<any>;
  let workflowUnitMock: jest.Mocked<any>;

  beforeEach(() => {
    persistenceMock = {
      getUnit: jest.fn(),
    } as unknown as jest.Mocked<Persistence>;
    workflowUnitMock = {
      save: jest.fn(),
    };
    persistenceMock.getUnit.mockReturnValue(workflowUnitMock);

    inputParameterMock = {
      read: jest.fn().mockResolvedValue({}),
    };

    context = {
      getLogger: jest.fn().mockReturnValue({
        error: jest.fn(),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockImplementation((plugin) => {
          if (plugin === PERSISTENCE_PLUGIN) {
            return persistenceMock;
          } else if (plugin === INPUT_PARAMETER_PLUGIN) {
            return inputParameterMock;
          }
          return {};
        }),
      }),
    };

    runCommand = new RunCommand(context);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    loggerSpy = jest.spyOn(context.getLogger(), 'error');
    runnerMock = {
      load: jest.fn(),
      run: jest.fn().mockResolvedValue({ id: 'workflow1', output: 'result' }),
      unload: jest.fn(),
    } as unknown as jest.Mocked<DefaultRunner>;
    jest.spyOn(DefaultRunner.prototype, 'load').mockImplementation(runnerMock.load);
    jest.spyOn(DefaultRunner.prototype, 'run').mockImplementation(runnerMock.run);
    jest.spyOn(DefaultRunner.prototype, 'unload').mockImplementation(runnerMock.unload);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    loggerSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('loads the run command into the program', () => {
    const program = new Command();
    const spy = jest.spyOn(program, 'command');
    runCommand.load(program);
    expect(spy).toHaveBeenCalledWith('run', { isDefault: true });
  });

  it('runs a workflow and writes the output to a file', async () => {
    const path = 'workflow.json';
    const options = { output: 'output.json', save: false };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    inputParameterMock.read.mockImplementation((filePath: string) => {
      if (filePath === path) {
        return Promise.resolve({ name: 'Workflow 1' });
      } else if (filePath === '{}') {
        return Promise.resolve({});
      }
      return Promise.reject(new Error('File not found'));
    });

    await runCommand['doAction'](path, options);

    expect(runnerMock.load).toHaveBeenCalled();
    expect(runnerMock.run).toHaveBeenCalledWith(expect.objectContaining({ name: 'Workflow 1' }), {});
    expect(runnerMock.unload).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith('output.json', JSON.stringify('result', null, 2), 'utf8');
  });

  it('passes input correctly to the workflow runner', async () => {
    const path = 'workflow.json';
    const options = { input: 'input.json', output: '', save: false };
    const inputContent = { key: 'value' };
    const workflowContent = { name: 'Workflow 1' };

    jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
      return filePath === path || filePath === options.input;
    });

    inputParameterMock.read.mockImplementation((filePath: string) => {
      if (filePath === path) {
        return Promise.resolve(workflowContent);
      } else if (filePath === options.input) {
        return Promise.resolve(inputContent);
      }
      return Promise.reject(new Error('File not found'));
    });

    await runCommand['doAction'](path, options);

    expect(runnerMock.load).toHaveBeenCalled();
    expect(runnerMock.run).toHaveBeenCalledWith(expect.objectContaining(workflowContent), inputContent);
    expect(runnerMock.unload).toHaveBeenCalled();
  });

  it('parses input JSON string and passes it to the workflow runner', async () => {
    const path = 'workflow.json';
    const options = { input: '{"key": "value"}', output: '', save: false };
    const inputContent = { key: 'value' };
    const workflowContent = { name: 'Workflow 1' };

    jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
      return filePath === path;
    });

    inputParameterMock.read.mockImplementation((filePath: string) => {
      if (filePath === path) {
        return Promise.resolve(workflowContent);
      }
      return Promise.resolve(JSON.parse(filePath));
    });

    await runCommand['doAction'](path, options);

    expect(runnerMock.load).toHaveBeenCalled();
    expect(runnerMock.run).toHaveBeenCalledWith(expect.objectContaining(workflowContent), inputContent);
    expect(runnerMock.unload).toHaveBeenCalled();
  });

  it('logs an error when the file does not exist', async () => {
    const path = 'nonexistent.json';
    const options = { output: '', save: false };
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await runCommand['doAction'](path, options);

    expect(loggerSpy).toHaveBeenCalledWith('File not found: nonexistent.json');
  });

  it('runs in pipe mode when the pipe option is set', async () => {
    const path = 'workflow.json';
    const options = { pipe: true };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const usePipeModeMock = jest.spyOn(LogHelper, 'usePipeMode').mockImplementation(async (_, fn) => {
      return await fn();
    });

    await runCommand['doAction'](path, options);

    expect(usePipeModeMock).toHaveBeenCalledWith(context, expect.any(Function));
    usePipeModeMock.mockRestore();
  });
});
