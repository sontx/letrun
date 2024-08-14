import { AppContext, ID_GENERATOR_PLUGIN, IdGenerator, loadConfigToPlugin } from '@letrun/core';

/**
 * Class responsible for generating unique IDs.
 */
export default class DefaultIdGenerator implements IdGenerator {
  name = 'default';
  type = ID_GENERATOR_PLUGIN;

  private idSeparator = '/';
  private freeId = 0;

  generateId(parentId?: string): string {
    return parentId ? `${parentId}${this.idSeparator}${this.freeId++}` : `${this.freeId++}`;
  }

  getParentId(id: string): string | undefined {
    return id?.substring(0, id.lastIndexOf(this.idSeparator));
  }

  async load(context: AppContext): Promise<void> {
    const config = await context.getConfigProvider().getAll();
    loadConfigToPlugin(config, this);
  }

  async unload(): Promise<void> {}
}
