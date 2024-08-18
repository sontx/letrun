import { JsonConfigProvider } from '@src/config/json-config-provider';
import { DEFAULT_LOGGER } from '@src/libs/log-helper';
import fs from 'fs';

const jest = import.meta.jest;

describe('JsonConfigProvider', () => {
  let jsonConfigProvider: JsonConfigProvider;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerSpy = jest.spyOn(DEFAULT_LOGGER, 'debug').mockImplementation();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('loads configuration from a valid JSON file', async () => {
    const filePath = 'config.json';
    jsonConfigProvider = new JsonConfigProvider(filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ key: 'value' }));

    const result = await jsonConfigProvider.load();

    expect(result).toEqual({ key: 'value' });
    expect(loggerSpy).toHaveBeenCalledWith(`Loaded JSON config from ${filePath} with 1 key(s)`);
  });

  it('returns an empty object when the file does not exist', async () => {
    const filePath = 'nonexistent.json';
    jsonConfigProvider = new JsonConfigProvider(filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await jsonConfigProvider.load();

    expect(result).toEqual({});
    expect(loggerSpy).toHaveBeenCalledWith(`File not found, skip this config file: ${filePath}`);
  });

  it('handles invalid JSON format gracefully', async () => {
    const filePath = 'invalid.json';
    jsonConfigProvider = new JsonConfigProvider(filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('invalid json');

    await expect(jsonConfigProvider.load()).rejects.toThrow(SyntaxError);
  });

  it('loads configuration with multiple keys from a JSON file', async () => {
    const filePath = 'config.json';
    jsonConfigProvider = new JsonConfigProvider(filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ key1: 'value1', key2: 'value2' }));

    const result = await jsonConfigProvider.load();

    expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    expect(loggerSpy).toHaveBeenCalledWith(`Loaded JSON config from ${filePath} with 2 key(s)`);
  });
});
