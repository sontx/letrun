import {
  AbstractPlugin,
  BUILTIN_PLUGIN_PRIORITY,
  getEntryPointDir,
  resolveTaskHandlerLocation,
  TASK_HANDLER_LOCATION_RESOLVER_PLUGIN,
  TaskHandlerLocationResolver,
} from '@letrun/core';
import { InvalidParameterError, ParsedHandler } from '@letrun/common';
import path from 'node:path';

export default class DefaultTaskHandlerLocationResolver extends AbstractPlugin implements TaskHandlerLocationResolver {
  readonly name = 'default';
  readonly type = TASK_HANDLER_LOCATION_RESOLVER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  private readonly cachedLocations = new Map<string, string>();

  constructor() {
    super();
    this.resolveLocation = this.resolveLocation.bind(this);
  }

  async resolveLocation(handler: ParsedHandler, throwsIfNotFound?: boolean) {
    const identify = `${handler.type}:${handler.name}`;
    if (this.cachedLocations.has(identify)) {
      return this.cachedLocations.get(identify)!;
    }

    return await this.resolveAndCache(identify, handler, throwsIfNotFound);
  }

  private async resolveAndCache(identify: string, handler: ParsedHandler, throwsIfNotFound: boolean | undefined) {
    const tasksDir = (await this.context?.getConfigProvider()?.get('task.dir', 'tasks')) ?? 'tasks';
    const customTasksDir = path.resolve(getEntryPointDir(), tasksDir);
    const location = await resolveTaskHandlerLocation(handler, customTasksDir);

    if (!location && throwsIfNotFound) {
      throw new InvalidParameterError(`Cannot find module: ${handler.name}, we looked up in this order:
1. If this type is 'package', we looked up in the node_modules directory, otherwise we stop immediately
2. Resolve it directly if it's an absolute path
3. Resolve it from the current directory
4. Resolve it from the runner directory
5. Lookup in the custom tasks directory (default is tasks directory)`);
    }

    if (location) {
      this.cachedLocations.set(identify, location);
    }

    return location;
  }
}
