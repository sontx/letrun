import winston from 'winston';
import { DefaultLogger } from './default-logger';

const jest = import.meta.jest;

describe('DefaultLogger', () => {
  let logger: winston.Logger;
  let defaultLogger: DefaultLogger;

  beforeEach(() => {
    logger = winston.createLogger({
      level: 'info',
      transports: [new winston.transports.Console()],
    });
    defaultLogger = new DefaultLogger(logger);
  });

  it('logs a verbose message', () => {
    const spy = jest.spyOn(logger, 'verbose');
    defaultLogger.verbose('verbose message', 'arg1', 'arg2');
    expect(spy).toHaveBeenCalledWith('verbose message', 'arg1', 'arg2');
  });

  it('logs a debug message', () => {
    const spy = jest.spyOn(logger, 'debug');
    defaultLogger.debug('debug message', 'arg1', 'arg2');
    expect(spy).toHaveBeenCalledWith('debug message', 'arg1', 'arg2');
  });

  it('logs an error message', () => {
    const spy = jest.spyOn(logger, 'error');
    defaultLogger.error('error message', 'arg1', 'arg2');
    expect(spy).toHaveBeenCalledWith('error message', 'arg1', 'arg2');
  });

  it('logs an informational message', () => {
    const spy = jest.spyOn(logger, 'info');
    defaultLogger.info('info message', 'arg1', 'arg2');
    expect(spy).toHaveBeenCalledWith('info message', 'arg1', 'arg2');
  });

  it('logs a warning message', () => {
    const spy = jest.spyOn(logger, 'warn');
    defaultLogger.warn('warn message', 'arg1', 'arg2');
    expect(spy).toHaveBeenCalledWith('warn message', 'arg1', 'arg2');
  });

  it('does not log a message if logger level is higher than message level', () => {
    logger.level = 'error';
    const spy = jest.spyOn(logger, 'info');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    defaultLogger.info('info message');

    expect(spy).toHaveBeenCalledWith('info message');
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
