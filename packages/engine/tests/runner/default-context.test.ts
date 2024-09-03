import { DefaultContext } from '@src/runner/default-context';
import { LOGGER_PLUGIN } from '@letrun/core';
import { ConfigProvider, Logger, PluginLoader, PluginManager } from '@letrun/common';

const jest = import.meta.jest;

describe('DefaultContext', () => {
  let context: DefaultContext;
  let mockConfigProvider: jest.Mocked<ConfigProvider>;
  let mockPluginManager: jest.Mocked<PluginManager>;
  let mockPluginLoader: jest.Mocked<PluginLoader>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockConfigProvider = {
      get: jest.fn().mockReturnValue(''),
      getInt: jest.fn(),
      getBoolean: jest.fn(),
    } as unknown as jest.Mocked<ConfigProvider>;

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockPluginManager = {
      load: jest.fn(),
      unload: jest.fn(),
      register: jest.fn(),
      get: jest.fn().mockReturnValue([]),
      getOne: jest.fn((pluginType) => {
        if (pluginType === LOGGER_PLUGIN) {
          return { getLogger: () => mockLogger };
        }
        throw new Error(`No plugin of type ${pluginType} found`);
      }),
    } as unknown as jest.Mocked<PluginManager>;

    mockPluginLoader = {
      load: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<PluginLoader>;

    context = new DefaultContext({
      configProvider: mockConfigProvider,
      pluginManager: mockPluginManager,
      pluginLoader: mockPluginLoader,
    });
  });

  it('loads the context successfully', async () => {
    await context.load();
    expect(mockPluginManager.load).toHaveBeenCalledWith(context);
    expect(context['loaded']).toBeTruthy();
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
    expect(context['loaded']).toBeFalsy();
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

    jest.spyOn(context as any, 'loadCustomPlugins').mockResolvedValue(undefined);

    context['defaultPluginLoader'] = defaultPluginLoader as any;
    context['pluginLoader'] = undefined;
    await context.load();
    expect(mockPluginManager.register).toHaveBeenCalledWith(plugins[0]);
  });

  it('loads custom plugins', async () => {
    const plugins = [{ name: 'customPlugin' }];
    (mockPluginLoader.load as jest.Mock).mockResolvedValue(plugins);

    jest.spyOn(context as any, 'loadDefaultPlugins').mockResolvedValue(undefined);

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
