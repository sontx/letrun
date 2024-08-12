import { EnvironmentConfigProvider } from './environment-config-provider';
import { DEFAULT_LOGGER } from '../logger';

const jest = import.meta.jest;

describe('EnvironmentConfigProvider', () => {
  let envConfigProvider: EnvironmentConfigProvider;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    envConfigProvider = new EnvironmentConfigProvider();
    loggerSpy = jest.spyOn(DEFAULT_LOGGER, 'debug').mockImplementation();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('loads environment variables successfully', async () => {
    process.env.TEST_VAR = 'test_value';
    const result = await envConfigProvider.load();
    expect(result.TEST_VAR).toBe('test_value');
    expect(loggerSpy).toHaveBeenCalledWith(`Loaded environment variables with ${Object.keys(process.env).length} key(s)`);
  });

  it('handles empty environment variables', async () => {
    process.env = {};
    const result = await envConfigProvider.load();
    expect(result).toEqual({});
    expect(loggerSpy).toHaveBeenCalledWith('Loaded environment variables with 0 key(s)');
  });

  it('handles multiple environment variables', async () => {
    process.env.VAR1 = 'value1';
    process.env.VAR2 = 'value2';
    const result = await envConfigProvider.load();
    expect(result.VAR1).toBe('value1');
    expect(result.VAR2).toBe('value2');
    expect(loggerSpy).toHaveBeenCalledWith('Loaded environment variables with 2 key(s)');
  });

  it('does not include undefined environment variables', async () => {
    process.env.VAR1 = 'value1';
    delete process.env.VAR2;
    const result = await envConfigProvider.load();
    expect(result.VAR1).toBe('value1');
    expect(result.VAR2).toBeUndefined();
    expect(loggerSpy).toHaveBeenCalledWith('Loaded environment variables with 1 key(s)');
  });
});
