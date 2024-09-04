import DefaultTaskHandlerLocationResolver from '@src/default-task-handler-location-resolver';
import fs from 'fs';
import { ParsedHandler } from '@letrun/common';

const jest = import.meta.jest;

describe('DefaultTaskHandlerLocationResolver', () => {
  let resolver: DefaultTaskHandlerLocationResolver;

  beforeEach(() => {
    resolver = new DefaultTaskHandlerLocationResolver();
    jest.resetAllMocks();
  });

  it('resolves location from cache if available', async () => {
    const handler: ParsedHandler = { type: 'script', name: 'cached-module.js' };
    const cachedLocation = '/cached/path/to/module.js';
    resolver['cachedLocations'].set('script:cached-module.js', cachedLocation);

    const result = await resolver.resolveLocation(handler);

    expect(result).toBe(cachedLocation);
  });

  it('throws InvalidParameterError when module is not found and throwsIfNotFound is true', async () => {
    const handler: ParsedHandler = { type: 'script', name: 'nonexistentModule' };
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await expect(resolver.resolveLocation(handler, true)).rejects.toThrow(
      `Cannot find module: nonexistentModule, we looked up in this order:
1. If this type is 'package', we looked up in the node_modules directory, otherwise we stop immediately
2. Resolve it directly if it's an absolute path\n3. Resolve it from the current directory
4. Resolve it from the runner directory
5. Lookup in the custom tasks directory (default is tasks directory)`,
    );
  });

  it('returns null when module is not found and throwsIfNotFound is false', async () => {
    const handler: ParsedHandler = { type: 'script', name: 'nonexistentModule' };
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await resolver.resolveLocation(handler, false);

    expect(result).toBeNull();
  });

  it('caches the resolved location', async () => {
    const handler: ParsedHandler = { type: 'script', name: 'module.js' };

    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    const resolveAndCacheSpy = jest.spyOn(resolver as any, 'resolveAndCache');

    // First call to resolveLocation
    const location1 = await resolver.resolveLocation(handler);

    // Second call to resolveLocation should use the cached location
    const location2 = await resolver.resolveLocation(handler);
    expect(location2).toBe(location1);

    // Ensure resolveAndCache is called only once
    expect(resolveAndCacheSpy).toHaveBeenCalledTimes(1);
  });
});
