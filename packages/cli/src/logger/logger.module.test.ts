import { transports } from 'winston';
import { LoggerModule } from './logger.module';
import { AppContext, LOGGER_PLUGIN } from '@letrun/core';
import { DefaultLogger } from './default-logger';

const jest = import.meta.jest;

it('loads logger module and adds plugin transports', async () => {
  const context = {
    getPluginManager: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue([{ getTransport: jest.fn().mockReturnValue(new transports.Console()) }]),
    }),
    getConfigProvider: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue('info'),
    }),
  };

  const loggerModule = new LoggerModule();
  await loggerModule.load(context as unknown as AppContext);

  expect(context.getPluginManager().get).toHaveBeenCalledWith(LOGGER_PLUGIN);
  expect(loggerModule['winstonLogger'].transports.length).toBe(1);
  expect(loggerModule['winstonLogger'].level).toBe('info');
});

it('unloads logger module and closes winston logger', async () => {
  const loggerModule = new LoggerModule();
  const closeSpy = jest.spyOn(loggerModule['winstonLogger'], 'close');

  await loggerModule.unload();

  expect(closeSpy).toHaveBeenCalled();
});

it('retrieves the logger instance', () => {
  const loggerModule = new LoggerModule();
  const logger = loggerModule.getLogger();

  expect(logger).toBeInstanceOf(DefaultLogger);
});
