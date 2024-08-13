import { RunCommand } from '@src/command/task/run.command';
import { DefaultRunner } from '@src/runner';
import fs from 'fs';
import { SystemTaskManager } from '@src/system-task';
import { TaskHelper } from '@src/command/libs/task-helper';

const jest = import.meta.jest;

describe('RunCommand', () => {
  let runCommand: RunCommand;
  let context: any;
  let consoleSpy: jest.SpyInstance;
  let runnerMock: jest.Mocked<DefaultRunner>;
  const outputFilePath = 'task-run-output.json';
  const outputValue = { output: 'result' };

  beforeEach(() => {
    context = {
      getLogger: jest.fn().mockReturnValue({
        error: jest.fn(),
      }),
    };
    runCommand = new RunCommand(context);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    runnerMock = {
      load: jest.fn(),
      run: jest.fn().mockResolvedValue(outputValue),
      unload: jest.fn(),
    } as unknown as jest.Mocked<DefaultRunner>;
    jest.spyOn(DefaultRunner.prototype, 'load').mockImplementation(runnerMock.load);
    jest.spyOn(DefaultRunner.prototype, 'run').mockImplementation(runnerMock.run);
    jest.spyOn(DefaultRunner.prototype, 'unload').mockImplementation(runnerMock.unload);

    if (fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);
    }
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
    if (fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);
    }
  });

  it('runs a system task successfully and writes the input message to the output file', async () => {
    const outputFilePath = 'output.json';
    jest.spyOn(SystemTaskManager, 'getSystemTasks').mockReturnValue({
      log: {
        name: 'log',
      } as any,
    });
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    jest.spyOn(fs.promises, 'unlink').mockResolvedValue();

    await (runCommand as any)['doAction']('log', { output: outputFilePath });

    expect(runnerMock.load).toHaveBeenCalled();
    expect(runnerMock.run).toHaveBeenCalledWith(
      expect.objectContaining({
        tasks: [expect.objectContaining({ name: 'log' })],
      }),
    );
    expect(runnerMock.unload).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      outputFilePath,
      JSON.stringify(outputValue.output, null, 2),
      'utf8',
    );
  });

  it('runs a custom task successfully and writes the output to the file', async () => {
    const outputFilePath = 'output.json';
    jest
      .spyOn(TaskHelper, 'loadCustomTasksFromConfig')
      .mockResolvedValue([{ name: 'customTask1', path: 'path/to/customTask1' }]);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    jest.spyOn(fs.promises, 'unlink').mockResolvedValue();

    await (runCommand as any)['doAction']('customTask1', { input: '{}', output: outputFilePath });

    expect(runnerMock.load).toHaveBeenCalled();
    expect(runnerMock.run).toHaveBeenCalledWith(
      expect.objectContaining({
        tasks: [expect.objectContaining({ name: 'customTask1' })],
      }),
    );
    expect(runnerMock.unload).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      outputFilePath,
      JSON.stringify(outputValue.output, null, 2),
      'utf8',
    );
  });

  it('handles missing system task gracefully', async () => {
    jest.spyOn(SystemTaskManager, 'getSystemTasks').mockReturnValue({});
    await (runCommand as any)['doAction']('log', { input: '{}' });
    expect(context.getLogger().error).toHaveBeenCalledWith('System task "log" not found');
  });

  it('handles missing custom task gracefully', async () => {
    jest.spyOn(TaskHelper, 'loadCustomTasksFromConfig').mockResolvedValue([]);
    await (runCommand as any)['doAction']('customTask1', { input: '{}' });
    expect(context.getLogger().error).toHaveBeenCalledWith('Task "customTask1" not found');
  });

  it('handles multiple custom tasks with same name gracefully', async () => {
    jest.spyOn(TaskHelper, 'loadCustomTasksFromConfig').mockResolvedValue([
      { name: 'customTask1', path: 'path/to/customTask1', group: 'group1' },
      { name: 'customTask1', path: 'path/to/customTask1', group: 'group2' },
    ]);
    await (runCommand as any)['doAction']('customTask1', { input: '{}', group: 'group1' });
    expect(context.getLogger().error).not.toHaveBeenCalled();
  });

  it('runs a task with input from file', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('{"key": "value"}');
    jest
      .spyOn(TaskHelper, 'loadCustomTasksFromConfig')
      .mockResolvedValue([{ name: 'customTask1', path: 'path/to/customTask1' }]);
    await (runCommand as any)['doAction']('customTask1', { input: 'input.json' });
    expect(runnerMock.run).toHaveBeenCalledWith(
      expect.objectContaining({
        tasks: [expect.objectContaining({ parameters: { key: 'value' } })],
      }),
    );
  });

  it('writes output to file', async () => {
    const outputFilePath = 'output.json';
    jest
      .spyOn(TaskHelper, 'loadCustomTasksFromConfig')
      .mockResolvedValue([{ name: 'customTask1', path: 'path/to/customTask1' }]);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    await (runCommand as any)['doAction']('customTask1', { input: '{}', output: outputFilePath });
    expect(fs.promises.writeFile).toHaveBeenCalledWith(outputFilePath, JSON.stringify('result', null, 2), 'utf8');
  });
});
