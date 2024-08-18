import { ChainConfigProvider } from '@src/config/chain-config-provider';
import { JsonConfigProvider } from '@src/config/json-config-provider';
import { YamlConfigProvider } from '@src/config/yaml-config-provider';
import { EnvironmentConfigProvider } from '@src/config/environment-config-provider';
import { ConfigNotFoundError } from '@letrun/core';

const jest = import.meta.jest;

describe('ChainConfigProvider', () => {
  let chainConfigProvider: ChainConfigProvider;
  let jsonConfigProviderMock: jest.Mocked<JsonConfigProvider>;
  let yamlConfigProviderMock: jest.Mocked<YamlConfigProvider>;
  let envConfigProviderMock: jest.Mocked<EnvironmentConfigProvider>;

  beforeEach(() => {
    jsonConfigProviderMock = {
      getAll: jest.fn(),
      get: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getBoolean: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getFloat: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getInt: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      set: jest.fn(),
      unload: jest.fn(),
    } as unknown as jest.Mocked<JsonConfigProvider>;

    yamlConfigProviderMock = {
      getAll: jest.fn(),
      get: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getBoolean: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getFloat: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getInt: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      set: jest.fn(),
      unload: jest.fn(),
    } as unknown as jest.Mocked<YamlConfigProvider>;

    envConfigProviderMock = {
      getAll: jest.fn(),
      get: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getBoolean: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getFloat: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      getInt: jest.fn().mockRejectedValue(new ConfigNotFoundError('')),
      set: jest.fn(),
      unload: jest.fn(),
    } as unknown as jest.Mocked<EnvironmentConfigProvider>;

    chainConfigProvider = new ChainConfigProvider();
    (chainConfigProvider as any)['configProviderChain'] = [
      jsonConfigProviderMock,
      yamlConfigProviderMock,
      envConfigProviderMock,
    ];
  });

  it('loads configuration from all providers', async () => {
    jsonConfigProviderMock.getAll.mockResolvedValue({ key1: 'value1' });
    yamlConfigProviderMock.getAll.mockResolvedValue({ key2: 'value2' });
    envConfigProviderMock.getAll.mockResolvedValue({ key3: 'value3' });

    const result = await chainConfigProvider.getAll();

    expect(result).toEqual({ key1: 'value1', key2: 'value2', key3: 'value3' });
  });

  it('returns default value when key is not found', async () => {
    const result = await chainConfigProvider.get('nonexistentKey', 'defaultValue');

    expect(result).toBe('defaultValue');
  });

  it('throws error when key is not found and no default value is provided', async () => {
    await expect(chainConfigProvider.get('nonexistentKey')).rejects.toThrow(ConfigNotFoundError);
  });

  it('sets configuration in all providers', async () => {
    await chainConfigProvider.set('key', 'value');

    expect(jsonConfigProviderMock.set).toHaveBeenCalledWith('key', 'value');
    expect(yamlConfigProviderMock.set).toHaveBeenCalledWith('key', 'value');
    expect(envConfigProviderMock.set).toHaveBeenCalledWith('key', 'value');
  });

  it('gets boolean configuration value', async () => {
    jsonConfigProviderMock.getBoolean.mockResolvedValue(true);

    const result = await chainConfigProvider.getBoolean('key', false);

    expect(result).toBe(true);
  });

  it('gets float configuration value', async () => {
    yamlConfigProviderMock.getFloat.mockResolvedValue(Promise.resolve(1.23));

    const result = await chainConfigProvider.getFloat('key', 0.0);

    expect(result).toBe(1.23);
  });

  it('gets integer configuration value', async () => {
    envConfigProviderMock.getInt.mockResolvedValue(42);

    const result = await chainConfigProvider.getInt('key', 0);

    expect(result).toBe(42);
  });

  it('config change should fire event', async () => {
    const changesSpy = jest.fn();
    chainConfigProvider.changes$.subscribe(changesSpy);

    await chainConfigProvider.set('initial.key', 'new_value');

    expect(changesSpy).toHaveBeenCalledWith({ 'initial.key': 'new_value' });
  });
});
