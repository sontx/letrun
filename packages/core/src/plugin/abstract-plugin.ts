import { AppContext, Plugin } from '../model';
import { loadConfigToPlugin } from '../utils';
import { Subject, takeUntil } from 'rxjs';

/**
 * Abstract class representing a plugin, cover some common cases and reduce the repeated code.
 * Implements the Plugin interface.
 */
export abstract class AbstractPlugin implements Plugin {
  abstract readonly name: string;
  abstract readonly type: string;

  protected readonly destroy$ = new Subject<void>();
  protected isLoaded = false;
  protected context?: AppContext;

  async load(context: AppContext) {
    if (this.isLoaded) {
      return;
    }

    this.context = context;
    await this.doLoad(context);
    this.listenForConfigChanges();
    context.getLogger().debug(`Plugin '${this.name}' loaded.`);
    this.isLoaded = true;
  }

  /**
   * Performs the actual loading of the plugin.
   * Can be overridden by subclasses.
   * @param context - The application context.
   */
  // @ts-ignore
  protected async doLoad(context: AppContext) {
    // Do nothing by default
  }

  private listenForConfigChanges() {
    this.context
      ?.getConfigProvider()
      .changes$.pipe(takeUntil(this.destroy$))
      .subscribe(async (newConfig) => {
        await this.onConfigChange(newConfig);
      });
  }

  /**
   * Handles configuration changes.
   * Can be overridden by subclasses.
   * @param newConfig - The new configuration.
   */
  // @ts-ignore
  protected async onConfigChange(newConfig: Record<string, any>) {
    // Do nothing by default
  }

  /**
   * Injects the configuration into the plugin.
   * By default, the configuration will follow this pattern: pluginType.pluginName.[configKey]
   */
  protected async injectConfig() {
    const configProvider = this.context?.getConfigProvider();
    if (!configProvider) {
      return;
    }
    const config = await configProvider.getAll();
    const keyCount = loadConfigToPlugin(config, this);
    this.context?.getLogger().debug(`Plugin '${this.name}' loaded with ${keyCount} configuration keys.`);
  }

  async unload() {
    if (!this.isLoaded) {
      return;
    }

    this.destroy$.next();
    this.destroy$.complete();
    await this.doUnload();
    this.context?.getLogger().debug(`Plugin '${this.name}' unloaded.`);
    this.context = undefined;
    this.isLoaded = false;
  }

  /**
   * Performs the actual unloading of the plugin.
   * Can be overridden by subclasses.
   */
  protected async doUnload() {
    // Do nothing by default
  }
}
