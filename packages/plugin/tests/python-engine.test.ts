import PythonEngine from '@src/python-engine';
import tmp from 'tmp';
import fs from 'fs';

const jest = import.meta.jest;

describe('PythonEngine', () => {
  it('returns undefined when script is empty', async () => {
    const engine = new PythonEngine();
    const result = await engine.run('', {});
    expect(result).toBeUndefined();
  });

  it('runs the script and returns parsed JSON result', async () => {
    const engine = new PythonEngine();
    const script = 'output = {"key": "value"}';
    const result = await engine.run(script, {});
    expect(result).toEqual({ key: 'value' });
  });

  it('runs the script and returns raw string if JSON parsing fails', async () => {
    const engine = new PythonEngine();
    const script = 'output = "raw string"';
    const result = await engine.run(script, {});
    expect(result).toBe('raw string');
  });

  it('returns null when there is no output variable assignment', async () => {
    const engine = new PythonEngine();
    const script = 'a = 1 + 1'; // No assignment to output
    const result = await engine.run(script, {});
    expect(result).toBeNull();
  });

  it('executes a script with context and returns the result', async () => {
    const engine = new PythonEngine();
    const context = { a: 1, b: 2 };
    const script = 'output = context["a"] + context["b"]';
    const result = await engine.run(script, context);
    expect(result).toBe(3);
  });

  it('removes temporary context file after execution', async () => {
    const engine = new PythonEngine();
    const script = 'output = "test"';
    const tmpFileSpy = jest.spyOn(tmp, 'fileSync');
    const inputFile = {
      name: 'tempfile.json',
      removeCallback: jest.fn().mockImplementation(() => {
        fs.unlinkSync('tempfile.json');
      }),
    };
    tmpFileSpy.mockReturnValue(inputFile as any);

    await engine.run(script, {});

    expect(inputFile.removeCallback).toHaveBeenCalled();
    tmpFileSpy.mockRestore();
  });

  it('supports .py extension', () => {
    const engine = new PythonEngine();
    expect(engine.support('py')).toBe(true);
  });

  it('does not support non-.py extensions', () => {
    const engine = new PythonEngine();
    expect(engine.support('js')).toBe(false);
  });

  it('throws an error when configured pythonPath is not found', async () => {
    const engine = new PythonEngine();
    engine['pythonPath'] = 'invalid-path-to-python';
    const script = 'output = "test"';

    await expect(engine.run(script, {})).rejects.toThrow('Python executable not found at');
  });
});
