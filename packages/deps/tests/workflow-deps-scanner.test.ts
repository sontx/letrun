import fs from 'node:fs';
import { WorkflowDepsScanner } from '@src/workflow-deps-scanner';
import { ContainerDef, LocationResolverFn, ModuleResolverFn } from '@letrun/core';

const jest = import.meta.jest;

describe('WorkflowDepsScanner', () => {
  let scanner: WorkflowDepsScanner;
  let mockLocationResolver: jest.Mocked<LocationResolverFn>;
  let mockModuleResolver: jest.Mocked<ModuleResolverFn>;

  beforeEach(() => {
    mockLocationResolver = jest.fn();
    mockModuleResolver = jest.fn().mockResolvedValue(class {});
    scanner = new WorkflowDepsScanner(mockLocationResolver, mockModuleResolver);
  });

  it('returns empty array if container has no tasks', async () => {
    const container: ContainerDef = { tasks: {} } as any;
    const result = await scanner.scan(container);
    expect(result).toEqual([]);
  });

  it('scans tasks and returns dependencies', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockReturnValue({ isDirectory: () => false } as any);
    (mockModuleResolver as jest.Mock).mockResolvedValue(
      class {
        version = '1.0.0';
      },
    );

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        version: '1.0.0',
        type: 'script',
      },
    ]);
  });

  it('handles missing version gracefully', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => false } as any);

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        type: 'script',
      },
    ]);
  });

  it('handles directory with package.json', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ version: '2.0.0' }));

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        version: '2.0.0',
        type: 'package',
      },
    ]);
  });

  it('handles invalid version gracefully', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => false } as any);
    (mockModuleResolver as jest.Mock).mockRejectedValue(new Error('Invalid version'));

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        version: 'Invalid version',
        type: 'script',
      },
    ]);
  });

  it('scans nested tasks and returns dependencies', async () => {
    const container: ContainerDef = {
      tasks: {
        task1: {
          handler: 'handler1',
          tasks: {
            task2: { handler: 'handler2' },
          },
        },
      },
    } as any;

    (mockLocationResolver as jest.Mock)
      .mockResolvedValueOnce('/path/to/handler1')
      .mockResolvedValueOnce('/path/to/handler2');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => false } as any);
    (mockModuleResolver as jest.Mock)
      .mockResolvedValueOnce(
        class {
          version = '1.0.0';
        },
      )
      .mockResolvedValueOnce(
        class {
          version = '2.0.0';
        },
      );

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        version: '1.0.0',
        type: 'script',
      },
      {
        name: 'task2',
        handler: 'handler2',
        dependency: '/path/to/handler2',
        installed: true,
        incompatibleVersion: false,
        version: '2.0.0',
        type: 'script',
      },
    ]);
  });

  it('sets installed to false when module is not found', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue(null);

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: 'handler1',
        installed: false,
        incompatibleVersion: false,
      },
    ]);
  });

  it('sets installed to false when module directory does not contain package.json', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        installed: false,
        incompatibleVersion: false,
      },
    ]);
  });

  it('sets type to script for file handlers', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => false } as any);

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        type: 'script',
      },
    ]);
  });

  it('sets type to package for directory handlers with package.json', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ version: '1.0.0' }));

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        incompatibleVersion: false,
        installed: true,
        version: '1.0.0',
        type: 'package',
      },
    ]);
  });

  it('handles task handler as a package name', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: '@letrun/core@0.0.1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/@letrun/core');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ version: '0.0.1' }));

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: '@letrun/core',
        dependency: '/path/to/@letrun/core',
        installed: true,
        incompatibleVersion: false,
        requireVersion: '0.0.1',
        version: '0.0.1',
        type: 'package',
      },
    ]);
  });

  it('handles incompatible version', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: '@letrun/core@1.0.0' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/@letrun/core');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ version: '2.0.0' }));

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: '@letrun/core',
        dependency: '/path/to/@letrun/core',
        installed: true,
        incompatibleVersion: true,
        requireVersion: '1.0.0',
        version: '2.0.0',
        type: 'package',
      },
    ]);
  });

  it('handles compatible version with range version', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: '@letrun/core@^1.0.0' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/@letrun/core');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => true } as any);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ version: '1.2.0' }));

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: '@letrun/core',
        dependency: '/path/to/@letrun/core',
        installed: true,
        incompatibleVersion: false,
        requireVersion: '^1.0.0',
        version: '1.2.0',
        type: 'package',
      },
    ]);
  });

  it('gets npm package version from npm repo', async () => {
    const packageName = 'some-package';
    const packageVersion = '^1.0.0';
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        name: packageName,
        'dist-tags': { latest: '1.0.0' },
      }),
    });

    const result = await scanner['tryGetNpmPackageVersion'](packageName);

    expect(result).toBe(packageVersion);
    expect(global.fetch).toHaveBeenCalledWith(`https://registry.npmjs.org/${packageName}`);
  });

  it('handles error when fetching npm package version', async () => {
    const packageName = 'some-package';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await scanner['tryGetNpmPackageVersion'](packageName);

    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(`https://registry.npmjs.org/${packageName}`);
  });

  it('resolves package version from npm repo if needed', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'some-package' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue(null);
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        name: 'some-package',
        'dist-tags': { latest: '1.0.0' },
      }),
    });

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'some-package',
        dependency: 'some-package',
        installed: false,
        incompatibleVersion: false,
        requireVersion: '^1.0.0',
        type: 'package',
      },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(`https://registry.npmjs.org/some-package`);
  });

  it('does not resolve npm package version if handler is not a package name', async () => {
    const handler = '/this/is/invalid/package';
    const container: ContainerDef = { tasks: { task1: { handler } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue(null);
    global.fetch = jest.fn();
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler,
        dependency: handler,
        installed: false,
        incompatibleVersion: false,
      },
    ]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
