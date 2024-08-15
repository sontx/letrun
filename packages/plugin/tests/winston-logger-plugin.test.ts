import winston, { transports } from 'winston';
import WinstonLoggerPlugin from '@src/winston-logger-plugin';
import { AppContext } from '@letrun/core';
import { Subject } from 'rxjs';

const jest = import.meta.jest;

describe('WinstonLoggerPlugin', () => {
  let plugin: WinstonLoggerPlugin;
  let context: AppContext;

  beforeEach(() => {
    plugin = new WinstonLoggerPlugin();
    context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        error: jest.fn(),
      })),
      getPluginManager: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue([]),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue('debug'),
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
  });

  it('loads the plugin and sets the logger level', async () => {
    await plugin.load(context);
    expect(plugin['winstonLogger'].level).toBe('debug');
  });

  it('unloads the plugin without errors', async () => {
    await expect(plugin.unload()).resolves.not.toThrow();
  });

  it('adds transports from other logger plugins', async () => {
    const mockTransport = new winston.transports.Console();
    context.getPluginManager().get = jest
      .fn()
      .mockResolvedValue([{ getTransport: jest.fn().mockReturnValue(mockTransport) }]);

    await plugin.load(context);
    await plugin.ready(context);
    expect(plugin['winstonLogger'].transports).toContain(mockTransport);
  });

  it('handles empty logger plugins list', async () => {
    context.getPluginManager().get = jest.fn().mockResolvedValue([{ getTransport: () => new transports.Console() }]);
    await plugin.load(context);
    await plugin.ready(context);
    expect(plugin['winstonLogger'].transports.length).toBe(1); // Default transport
  });

  it('handles logger level from config provider', async () => {
    context.getConfigProvider().get = jest.fn().mockResolvedValue('info');
    await plugin.load(context);
    expect(plugin['winstonLogger'].level).toBe('info');
  });

  it('does not log messages after the plugin is unloaded', async () => {
    await plugin.load(context);
    await plugin.unload();

    const winstonLogger = plugin['winstonLogger'];
    const logSpy = jest.spyOn(winstonLogger, 'debug');

    plugin.getLogger().debug('This message should not be logged');

    expect(logSpy).not.toHaveBeenCalled();
  });
});
