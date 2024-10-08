import ConsoleLogger from '@src/console-logger';
import { AppContext } from '@letrun/common';
import { transports } from 'winston';
import { Subject } from 'rxjs';

const jest = import.meta.jest;

describe('ConsoleLogger', () => {
  it('returns a transport with default options', () => {
    const logger = new ConsoleLogger();
    const transport = logger.getTransport();
    expect(transport).toBeInstanceOf(transports.Console);
    expect(transport.format).toBeDefined();
  });

  it('returns a transport with custom timestamp format', () => {
    const logger = new ConsoleLogger();
    logger['options'] = { showTimestamp: true, timestampFormat: 'YYYY-MM-DD' };
    const transport = logger.getTransport();
    expect(transport.format).toBeDefined();
  });

  it('loads configuration correctly', async () => {
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      })),
      getConfigProvider: jest.fn().mockReturnValue({
        getBoolean: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue('value'),
        getInt: jest.fn().mockResolvedValue(1),
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const logger = new ConsoleLogger();
    await logger.load(context);
    expect(logger['options']).toBeDefined();
    expect(logger['options']?.showMeta).toBe(true);
  });

  it('unloads without errors', async () => {
    const logger = new ConsoleLogger();
    await expect(logger.unload()).resolves.toBeUndefined();
  });
});
