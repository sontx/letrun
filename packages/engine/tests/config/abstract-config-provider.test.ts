import { ConfigNotFoundError } from '@letrun/common';
import { AbstractConfigProvider } from '@src/config/abstract-config-provider';

const jest = import.meta.jest;

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

  it('set and getAll', async () => {
    await provider.set('new.key', 'new_value');
    const allConfig = await provider.getAll();
    expect(allConfig['new.key']).toBe('new_value');
  });

  it('getBoolean', async () => {
    const value = await provider.getBoolean('boolean.key');
    expect(value).toBe(true);
  });

  it('getFloat', async () => {
    const value = await provider.getFloat('number.key');
    expect(value).toBe(42.0);
  });

  it('getInt', async () => {
    const value = await provider.getInt('number.key');
    expect(value).toBe(42);
  });

  it('get with exact key', async () => {
    const value = await provider.get('test.key');
    expect(value).toBe('value');
  });

  it('get with uppercase key', async () => {
    const value = await provider.get('TEST_KEY');
    expect(value).toBe('uppercase_value');
  });

  it('get with camel case key', async () => {
    const value = await provider.get('testKey');
    expect(value).toBe('camelCaseValue');
  });

  it('get with kebab case key', async () => {
    const value = await provider.get('test-key');
    expect(value).toBe('kebab-case-value');
  });

  it('get with non-existent key and default value', async () => {
    const value = await provider.get('non.existent.key', 'default_value');
    expect(value).toBe('default_value');
  });

  it('get with non-existent key and no default value', async () => {
    await expect(provider.get('non.existent.key')).rejects.toThrow(ConfigNotFoundError);
  });

  it('config change should fire event', async () => {
    const provider = new MockConfigProvider({
      'initial.key': 'initial_value',
    });

    const changesSpy = jest.fn();
    provider.changes$.subscribe(changesSpy);

    await provider.set('initial.key', 'new_value');

    expect(changesSpy).toHaveBeenCalledWith({ 'initial.key': 'new_value' });
  });
});
