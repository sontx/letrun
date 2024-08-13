import { DefaultContext } from '@src/runner/default-context';
import { ConfigProvider, Logger, PluginLoader, PluginManager } from '@letrun/core';
import { LoggerModule } from '@src/logger';

const jest = import.meta.jest;

describe('DefaultContext', () => {
  let context: DefaultContext;
  let mockConfigProvider: jest.Mocked<ConfigProvider>;
  let mockPluginManager: jest.Mocked<PluginManager>;
  let mockPluginLoader: jest.Mocked<PluginLoader>;
  let mockLogger: jest.Mocked<Logger>;
  let mockLoggerModule: jest.Mocked<LoggerModule>;

  beforeEach(() => {
    mockConfigProvider = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigProvider>;

    mockPluginManager = {
      load: jest.fn(),
      unload: jest.fn(),
      register: jest.fn(),
      get: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<PluginManager>;

    mockPluginLoader = {
      load: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<PluginLoader>;

    mockLogger = {
      info: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockLoggerModule = {
      load: jest.fn(),
      unload: jest.fn(),
      getLogger: jest.fn().mockReturnValue(mockLogger),
    } as unknown as jest.Mocked<LoggerModule>;

    context = new DefaultContext({
      configProvider: mockConfigProvider,
      pluginManager: mockPluginManager,
      pluginLoader: mockPluginLoader,
    });
    (context as any)['loggerModule'] = mockLoggerModule;
  });

  it('loads the context successfully', async () => {
    await context.load();
    expect(mockPluginManager.load).toHaveBeenCalledWith(context);
    expect(mockLogger.info).toHaveBeenCalledWith('App context loaded');
  });

  it('does not reload the context if already loaded', async () => {
    await context.load();
    await context.load();
    expect(mockPluginManager.load).toHaveBeenCalledTimes(1);
  });

  it('unloads the context successfully', async () => {
    await context.load();
    await context.unload();
    expect(mockPluginManager.unload).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('App context unloaded');
  });

  it('does not unload the context if not loaded', async () => {
    await context.unload();
    expect(mockPluginManager.unload).not.toHaveBeenCalled();
  });

  it('loads default plugins', async () => {
    const plugins = [{ name: 'defaultPlugin' }];
    const defaultPluginLoader = {
      load: jest.fn().mockReturnValue(plugins),
    };

    context['defaultPluginLoader'] = defaultPluginLoader as any;
    context['pluginLoader'] = undefined;
    await context.load();
    expect(mockPluginManager.register).toHaveBeenCalledWith(plugins[0]);
  });

  it('loads custom plugins', async () => {
    const plugins = [{ name: 'customPlugin' }];
    (mockPluginLoader.load as jest.Mock).mockResolvedValue(plugins);

    await context.load();
    expect(mockPluginManager.register).toHaveBeenCalledWith(plugins[0]);
  });

  it('uses default config provider if not provided', async () => {
    context = new DefaultContext();
    await context.load();
    expect(context.getConfigProvider()).toBeDefined();
  });

  it('uses default plugin manager if not provided', async () => {
    context = new DefaultContext();
    await context.load();
    expect(context.getPluginManager()).toBeDefined();
  });
});
