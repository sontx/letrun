import { AppContext, FunctionKeys, IllegalStateError, InterruptInvokeError, Plugin, PluginManager } from '@letrun/core';

/**
 * Class representing a simple plugin manager.
 * Implements the PluginManager interface.
 */
export class SimplePluginManager implements PluginManager {
  private pluginMap: Map<string, Plugin[]> = new Map<string, Plugin[]>();
  private loadedPlugins: Plugin[] = [];
  private context?: AppContext;

  register(plugin: Plugin): void {
    const plugins = this.pluginMap.get(plugin.type) || [];
    plugins.push(plugin);
    this.pluginMap.set(
      plugin.type,
      plugins.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
    );
  }

  getAll(): Promise<Map<string, Plugin[]>> {
    return Promise.resolve(new Map(this.pluginMap));
  }

  get<T extends Plugin>(type: string): Promise<T[]> {
    const foundPlugins = (this.pluginMap.get(type) as T[]) || [];
    return Promise.all(foundPlugins.map((plugin) => this.loadPluginIfNotLoaded(plugin)));
  }

  async getOne<T extends Plugin>(type: string): Promise<T> {
    const foundPlugins = (this.pluginMap.get(type) as T[]) || [];
    if (foundPlugins.length === 0) {
      throw new Error(`No plugin of type ${type} found`);
    }
    const firstPlugin = foundPlugins[0]!;
    if (foundPlugins.length > 1) {
      this.context
        ?.getLogger()
        ?.debug(`Multiple plugins of type ${type} found, returning the highest priority: ${firstPlugin.name}`);
    }
    return this.loadPluginIfNotLoaded(firstPlugin);
  }

  private async loadPluginIfNotLoaded<T extends Plugin>(plugin: T): Promise<T> {
    if (!this.context) {
      throw new IllegalStateError('Context provider not set');
    }

    if (this.loadedPlugins.includes(plugin)) {
      return plugin;
    }

    if (plugin.load) {
      await plugin.load(this.context);
    }

    this.loadedPlugins.push(plugin);
    return plugin;
  }

  async callPluginMethod<TPlugin extends Plugin = any, TResult = any>(
    type: string,
    method: FunctionKeys<TPlugin>,
    ...args: any[]
  ): Promise<TResult | undefined> {
    const logger = this.context?.getLogger();
    const plugins = await this.get<TPlugin>(type);
    if (plugins.length === 0) {
      logger?.verbose(`No plugin of type ${type} found`);
      return undefined as any;
    }

    let previousInvokeResult = null;
    let invokedAtLeastOnePlugin = false;
    const effectiveArgs = args ?? [];
    for (const plugin of plugins) {
      if (!plugin[method]) {
        continue;
      }

      invokedAtLeastOnePlugin = true;
      const fn = plugin[method] as Function;
      try {
        const res = fn.apply(plugin, [...effectiveArgs, previousInvokeResult]);
        previousInvokeResult = res;
        if (res instanceof Promise) {
          previousInvokeResult = await res;
        }
      } catch (e: any) {
        if (e instanceof InterruptInvokeError) {
          logger?.debug(`Interrupting invoke on plugin of type ${type} (${plugin.name}) due to ${e.message}`);
          return e.result;
        }
        throw e;
      }
    }

    if (!invokedAtLeastOnePlugin) {
      throw new Error(`No method ${method as string} found on plugin of type ${type}`);
    }

    return previousInvokeResult;
  }

  load(context: AppContext) {
    this.context = context;
  }

  async unload(): Promise<void> {
    for (const plugin of this.loadedPlugins) {
      try {
        if (plugin.unload) {
          await plugin.unload();
        }
      } catch (e: any) {
        this.context?.getLogger()?.error(`Error while unloading plugin ${plugin.name}:`, e);
      }
    }
  }
}
