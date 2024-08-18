import { ScriptEngineWrapper } from '@src/libs/script-engine-wrapper';
import { ScriptEngine } from '@letrun/core';

const jest = import.meta.jest;

describe('ScriptEngineWrapper', () => {
  let scriptEngineWrapper: ScriptEngineWrapper;
  let mockScriptEngines: jest.Mocked<ScriptEngine[]>;

  beforeEach(() => {
    mockScriptEngines = [
      { name: 'javascript', run: jest.fn().mockResolvedValue('js result'), support: jest.fn((ext) => ext === 'js') },
      { name: 'python', run: jest.fn().mockResolvedValue('py result'), support: jest.fn((ext) => ext === 'py') },
    ] as any;
    scriptEngineWrapper = new ScriptEngineWrapper(mockScriptEngines);
  });

  it('runs script with default language when no language or file extension is provided', async () => {
    const result = await scriptEngineWrapper.run('2 + 2', {});
    expect(mockScriptEngines[0]!.run).toHaveBeenCalledWith('2 + 2', { input: undefined });
    expect(result).toBe('js result');
  });

  it('runs script with specified language', async () => {
    const result = await scriptEngineWrapper.run('print("hello")', { language: 'python' });
    expect(mockScriptEngines[1]!.run).toHaveBeenCalledWith('print("hello")', { input: undefined });
    expect(result).toBe('py result');
  });

  it('throws error when no script engine is found for specified language', async () => {
    await expect(scriptEngineWrapper.run('2 + 2', { language: 'nonexistent' })).rejects.toThrow(
      'No script engine found for language: nonexistent',
    );
  });

  it('runs script with specified file extension', async () => {
    (mockScriptEngines[0] as any)!.support.mockReturnValueOnce(true);
    const result = await scriptEngineWrapper.run('2 + 2', { file: 'script.js' });
    expect(mockScriptEngines[0]!.run).toHaveBeenCalledWith('2 + 2', { input: undefined });
    expect(result).toBe('js result');
  });

  it('throws error when no script engine is found for specified file extension', async () => {
    await expect(scriptEngineWrapper.run('2 + 2', { file: 'script.nonexistent' })).rejects.toThrow(
      'No script engine found for file extension: nonexistent',
    );
  });

  it('runs script with input parameter', async () => {
    const result = await scriptEngineWrapper.run('input.a + input.b', { input: { a: 1, b: 2 } });
    expect(mockScriptEngines[0]!.run).toHaveBeenCalledWith('input.a + input.b', { input: { a: 1, b: 2 } });
    expect(result).toBe('js result');
  });
});
