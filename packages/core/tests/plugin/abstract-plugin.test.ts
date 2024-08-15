import { Subject } from 'rxjs';
import { AbstractPlugin } from '@src/plugin/abstract-plugin';
import { AppContext } from '@src/model';

const jest = import.meta.jest;

class TestPlugin extends AbstractPlugin {
  readonly name = 'TestPlugin';
  readonly type = 'TestType';

  protected async doLoad(_: AppContext) {
    // Custom load logic for testing
  }

  protected async onConfigChange(_: Record<string, any>) {
    // Custom config change logic for testing
  }

  protected async doUnload() {
    // Custom unload logic for testing
  }
}

describe('AbstractPlugin', () => {
  let plugin: TestPlugin;
  let mockContext: AppContext;

  beforeEach(() => {
    plugin = new TestPlugin();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        changes$: new Subject(),
        getAll: jest.fn().mockResolvedValue({}),
      }),
    } as any;
  });

  it('loads the plugin and sets isLoaded to true', async () => {
    await plugin.load(mockContext);
    expect(plugin['isLoaded']).toBe(true);
  });

  it('does not load the plugin if already loaded', async () => {
    plugin['isLoaded'] = true;
    await plugin.load(mockContext);
    expect(mockContext.getLogger().debug).not.toHaveBeenCalledWith(`Plugin '${plugin.name}' loaded.`);
  });

  it('unloads the plugin and sets isLoaded to false', async () => {
    await plugin.load(mockContext);
    await plugin.unload();
    expect(plugin['isLoaded']).toBe(false);
  });

  it('does not unload the plugin if not loaded', async () => {
    await plugin.unload();
    expect(mockContext.getLogger().debug).not.toHaveBeenCalledWith(`Plugin '${plugin.name}' unloaded.`);
  });

  it('injects configuration into the plugin', async () => {
    const configProvider = mockContext.getConfigProvider();
    (configProvider.getAll as jest.Mock).mockResolvedValue({ 'TestType.TestPlugin.key': 'value' });
    await plugin.load(mockContext);
    await plugin['injectConfig']();
    expect(configProvider.getAll).toHaveBeenCalled();
  });

  it('listens for configuration changes and handles them', async () => {
    const configProvider = mockContext.getConfigProvider();
    const newConfig = { 'TestType.TestPlugin.key': 'new_value' };
    await plugin.load(mockContext);
    const onConfigChangeSpy = jest.spyOn(plugin as any, 'onConfigChange');
    (configProvider as any).changes$.next(newConfig);
    expect(onConfigChangeSpy).toHaveBeenCalledWith(newConfig);
  });
});
