import { SimplePluginManager } from './simple-plugin-manager';
import { AppContext, Plugin, IllegalStateError, InterruptInvokeError } from '@letrun/core';

const jest = import.meta.jest;

describe('SimplePluginManager', () => {
  let pluginManager: SimplePluginManager;
  let mockContext: AppContext;
  let mockLogger: any;

  beforeEach(() => {
    pluginManager = new SimplePluginManager();
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      verbose: jest.fn(),
    };
    mockContext = {
      getLogger: () => mockLogger,
    } as unknown as AppContext;
  });

  it('registers and retrieves plugins by type', async () => {
    const pluginA: Plugin = { type: 'typeA', name: 'PluginA' } as any;
    const pluginB: Plugin = { type: 'typeA', name: 'PluginB' } as any;

    pluginManager.register(pluginA);
    pluginManager.register(pluginB);
    pluginManager.load(mockContext);

    const plugins = await pluginManager.get<Plugin>('typeA');
    expect(plugins.length).toBe(2)
  });

  it('throws error if no plugin of specified type is found', async () => {
    await expect(pluginManager.getOne<Plugin>('typeA')).rejects.toThrow('No plugin of type typeA found');
  });

  it('loads plugin if not already loaded', async () => {
    const plugin: Plugin = { type: 'typeA', name: 'PluginA', load: jest.fn() } as any;

    pluginManager.register(plugin);
    pluginManager.load(mockContext);

    const loadedPlugin = await pluginManager.getOne<Plugin>('typeA');
    expect(plugin.load).toHaveBeenCalledWith(mockContext);
    expect(loadedPlugin).toBe(plugin);
  });

  it('does not reload plugin if already loaded', async () => {
    const plugin: Plugin = { type: 'typeA', name: 'PluginA', load: jest.fn() } as any;

    pluginManager.register(plugin);
    pluginManager.load(mockContext);

    await pluginManager.getOne<Plugin>('typeA');
    await pluginManager.getOne<Plugin>('typeA');

    expect(plugin.load).toHaveBeenCalledTimes(1);
  });

  it('calls plugin method and returns result', async () => {
    const plugin: Plugin = { type: 'typeA', name: 'PluginA', someMethod: jest.fn().mockReturnValue('result') } as any;

    pluginManager.register(plugin);
    pluginManager.load(mockContext);

    const result = await pluginManager.callPluginMethod('typeA', 'someMethod');
    expect(result).toBe('result');
  });

  it('throws error if no method found on plugin', async () => {
    const plugin: Plugin = { type: 'typeA', name: 'PluginA' } as any;

    pluginManager.register(plugin);
    pluginManager.load(mockContext);

    await expect(pluginManager.callPluginMethod('typeA', 'nonExistentMethod')).rejects.toThrow(
      'No method nonExistentMethod found on plugin of type typeA',
    );
  });

  it('handles InterruptInvokeError and returns result', async () => {
    const plugin: Plugin = {
      type: 'typeA',
      name: 'PluginA',
      someMethod: jest.fn().mockImplementation(() => {
        throw new InterruptInvokeError('Interrupt', 'interruptedResult');
      }),
    } as any;

    pluginManager.register(plugin);
    pluginManager.load(mockContext);

    const result = await pluginManager.callPluginMethod('typeA', 'someMethod');
    expect(result).toBe('interruptedResult');
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Interrupting invoke on plugin of type typeA (PluginA) due to Interrupt',
    );
  });

  it('unloads all loaded plugins', async () => {
    const plugin: Plugin = { type: 'typeA', name: 'PluginA', load: jest.fn(), unload: jest.fn() };

    pluginManager.register(plugin);
    pluginManager.load(mockContext);

    await pluginManager.getOne<Plugin>('typeA');
    await pluginManager.unload();

    expect(plugin.unload).toHaveBeenCalled();
  });

  it('logs error if plugin unload fails', async () => {
    const plugin: Plugin = {
      type: 'typeA',
      name: 'PluginA',
      load: jest.fn(),
      unload: jest.fn().mockImplementation(() => {
        throw new Error('Unload error');
      }),
    };

    pluginManager.register(plugin);
    pluginManager.load(mockContext);

    await pluginManager.getOne<Plugin>('typeA');
    await pluginManager.unload();

    expect(mockLogger.error).toHaveBeenCalledWith('Error while unloading plugin PluginA:', expect.any(Error));
  });

  it('throws IllegalStateError if context is not set', async () => {
    const plugin: Plugin = { type: 'typeA', name: 'PluginA', load: jest.fn() } as any;

    pluginManager.register(plugin);

    await expect(pluginManager.getOne<Plugin>('typeA')).rejects.toThrow(IllegalStateError);
  });
});
