import { RunCommand } from '@src/command/run.command';
import { DefaultRunner } from '@src/runner';
import { Persistence } from '@letrun/core';
import { Command } from 'commander';
import fs from 'fs';

const jest = import.meta.jest;

describe('RunCommand', () => {
  let runCommand: RunCommand;
  let context: any;
  let consoleSpy: jest.SpyInstance;
  let loggerSpy: jest.SpyInstance;
  let runnerMock: jest.Mocked<DefaultRunner>;
  let persistenceMock: jest.Mocked<Persistence>;
  let workflowUnitMock: jest.Mocked<any>;

  beforeEach(() => {
    persistenceMock = {
      getUnit: jest.fn(),
    } as unknown as jest.Mocked<Persistence>;
    workflowUnitMock = {
      save: jest.fn(),
    };
    persistenceMock.getUnit.mockReturnValue(workflowUnitMock);

    context = {
      getLogger: jest.fn().mockReturnValue({
        error: jest.fn(),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue(persistenceMock),
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

  it('runs a workflow from a JSON file and writes the output to a file', async () => {
    const path = 'workflow.json';
    const options = { output: 'output.json', save: false };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ name: 'Workflow 1' }));
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    await runCommand['doAction'](path, options);

    expect(runnerMock.load).toHaveBeenCalled();
    expect(runnerMock.run).toHaveBeenCalledWith(expect.objectContaining({ name: 'Workflow 1' }));
    expect(runnerMock.unload).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith('output.json', JSON.stringify('result', null, 2), 'utf8');
  });

  it('runs a workflow from a YAML file and saves the workflow after running', async () => {
    const path = 'workflow.yaml';
    const options = { output: '', save: true };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('name: Workflow 1');
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    await runCommand['doAction'](path, options);

    expect(runnerMock.load).toHaveBeenCalled();
    expect(runnerMock.run).toHaveBeenCalledWith(expect.objectContaining({ name: 'Workflow 1' }));
    expect(runnerMock.unload).toHaveBeenCalled();
    expect(workflowUnitMock.save).toHaveBeenCalledWith('workflow1', expect.objectContaining({ id: 'workflow1' }));
  });

  it('logs an error when the file does not exist', async () => {
    const path = 'nonexistent.json';
    const options = { output: '', save: false };
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await runCommand['doAction'](path, options);

    expect(loggerSpy).toHaveBeenCalledWith('File not found: nonexistent.json');
  });

  it('logs an error for unsupported file extensions', async () => {
    const path = 'workflow.txt';
    const options = { output: '', save: false };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    await runCommand['doAction'](path, options);

    expect(loggerSpy).toHaveBeenCalledWith('Invalid file extension. Only JSON and YAML files are supported.');
  });
});
