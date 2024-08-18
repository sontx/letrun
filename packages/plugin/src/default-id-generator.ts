import { AbstractPlugin, AppContext, BUILTIN_PLUGIN_PRIORITY, ID_GENERATOR_PLUGIN, IdGenerator } from '@letrun/core';

/**
 * Class responsible for generating unique IDs.
 */
export default class DefaultIdGenerator extends AbstractPlugin implements IdGenerator {
  readonly name = 'default';
  readonly type = ID_GENERATOR_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  private idSeparator = '/';
  private freeId = 0;

  generateId(parentId?: string): string {
    return parentId ? `${parentId}${this.idSeparator}${this.freeId++}` : `${this.freeId++}`;
  }

  getParentId(id: string): string | undefined {
    return id?.substring(0, id.lastIndexOf(this.idSeparator));
  }

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    await this.injectConfig();
  }
}
