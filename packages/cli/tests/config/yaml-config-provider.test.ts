import fs from 'fs';
import { YamlConfigProvider } from '@src/config/yaml-config-provider';
import { DEFAULT_LOGGER } from '@src/libs/log-helper';
import { YAMLParseError } from 'yaml';

const jest = import.meta.jest;

describe('YamlConfigProvider', () => {
  let yamlConfigProvider: YamlConfigProvider;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerSpy = jest.spyOn(DEFAULT_LOGGER, 'debug').mockImplementation();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('loads configuration from a valid YAML file', async () => {
    const filePath = 'config.yaml';
    yamlConfigProvider = new YamlConfigProvider(filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('key: value');

    const result = await yamlConfigProvider.load();

    expect(result).toEqual({ key: 'value' });
    expect(loggerSpy).toHaveBeenCalledWith(`Loaded YAML config from ${filePath} with 1 key(s)`);
  });

  it('returns an empty object when the file does not exist', async () => {
    const filePath = 'nonexistent.yaml';
    yamlConfigProvider = new YamlConfigProvider(filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await yamlConfigProvider.load();

    expect(result).toEqual({});
    expect(loggerSpy).toHaveBeenCalledWith(`File not found, skip this config file: ${filePath}`);
  });

  it('handles invalid YAML format gracefully', async () => {
    const filePath = 'invalid.yaml';
    yamlConfigProvider = new YamlConfigProvider(filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('invalid: yaml:');

    await expect(yamlConfigProvider.load()).rejects.toThrow(YAMLParseError);
  });

  it('loads configuration with multiple keys from a YAML file', async () => {
    const filePath = 'config.yaml';
    yamlConfigProvider = new YamlConfigProvider(filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('key1: value1\nkey2: value2');

    const result = await yamlConfigProvider.load();

    expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    expect(loggerSpy).toHaveBeenCalledWith(`Loaded YAML config from ${filePath} with 2 key(s)`);
  });
});
