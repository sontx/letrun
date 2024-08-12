import DefaultJavascriptEngine from './default-javascript-engine';
import { AppContext } from '@letrun/core';

const jest = import.meta.jest;

describe('DefaultJavascriptEngine', () => {
  it('executes a script and returns the result', async () => {
    const engine = new DefaultJavascriptEngine();
    const result = await engine.run('2 + 2', {});
    expect(result).toBe(4);
  });

  it('executes a script with context and returns the result', async () => {
    const engine = new DefaultJavascriptEngine();
    const context = { a: 1, b: 2 };
    const result = await engine.run('a + b', context);
    expect(result).toBe(3);
  });

  it('returns undefined for an empty script', async () => {
    const engine = new DefaultJavascriptEngine();
    const result = await engine.run('', {});
    expect(result).toBeUndefined();
  });

  it('handles asynchronous scripts correctly', async () => {
    const engine = new DefaultJavascriptEngine();
    const result = await engine.run('Promise.resolve(42)', {});
    expect(result).toBe(42);
  });

  it('loads configuration correctly', async () => {
    const context = {
      getConfigProvider: jest.fn().mockReturnValue({
        getAll: jest.fn().mockReturnValue({ javascript: { default: { key: 'value' } } }),
      }),
    } as unknown as AppContext;
    const engine = new DefaultJavascriptEngine();
    await engine.load(context);
    expect((engine as any)['key']).toBe('value');
  });

  it('unloads without errors', async () => {
    const engine = new DefaultJavascriptEngine();
    await expect(engine.unload()).resolves.toBeUndefined();
  });
});
