import { ConfigNotFoundError } from '@letrun/core';
import { AbstractConfigProvider } from '@src/config/abstract-config-provider';

class MockConfigProvider extends AbstractConfigProvider {
  private readonly testData: Record<string, any>;

  constructor(testData: Record<string, any>) {
    super();
    this.testData = testData;
  }

  async load(): Promise<Record<string, any>> {
    return this.testData;
  }
}

describe('AbstractConfigProvider', () => {
  let provider: MockConfigProvider;

  beforeEach(() => {
    provider = new MockConfigProvider({
      'test.key': 'value',
      TEST_KEY: 'uppercase_value',
      testKey: 'camelCaseValue',
      'test-key': 'kebab-case-value',
      'number.key': '42',
      'boolean.key': 'true',
    });
  });

  test('set and getAll', async () => {
    await provider.set('new.key', 'new_value');
    const allConfig = await provider.getAll();
    expect(allConfig['new.key']).toBe('new_value');
  });

  test('getBoolean', async () => {
    const value = await provider.getBoolean('boolean.key');
    expect(value).toBe(true);
  });

  test('getFloat', async () => {
    const value = await provider.getFloat('number.key');
    expect(value).toBe(42.0);
  });

  test('getInt', async () => {
    const value = await provider.getInt('number.key');
    expect(value).toBe(42);
  });

  test('get with exact key', async () => {
    const value = await provider.get('test.key');
    expect(value).toBe('value');
  });

  test('get with uppercase key', async () => {
    const value = await provider.get('TEST_KEY');
    expect(value).toBe('uppercase_value');
  });

  test('get with camel case key', async () => {
    const value = await provider.get('testKey');
    expect(value).toBe('camelCaseValue');
  });

  test('get with kebab case key', async () => {
    const value = await provider.get('test-key');
    expect(value).toBe('kebab-case-value');
  });

  test('get with non-existent key and default value', async () => {
    const value = await provider.get('non.existent.key', 'default_value');
    expect(value).toBe('default_value');
  });

  test('get with non-existent key and no default value', async () => {
    await expect(provider.get('non.existent.key')).rejects.toThrow(ConfigNotFoundError);
  });
});
