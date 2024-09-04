import fs from 'node:fs';
import { WorkflowDepsScanner } from '@src/workflow-deps-scanner';
import { LocationResolverFn, TaskGroupResolverFn, TaskHandlerParserFn } from '@letrun/core';
import { ContainerDef } from '@letrun/common';

const jest = import.meta.jest;

describe('WorkflowDepsScanner', () => {
  let scanner: WorkflowDepsScanner;
  let mockTaskHandlerParser: jest.Mocked<TaskHandlerParserFn>;
  let mockLocationResolver: jest.Mocked<LocationResolverFn>;
  let mockTaskGroupResolver: jest.Mocked<TaskGroupResolverFn>;
  let mockCheckSystemDependencyFn: jest.MockedFunction<(handler: string) => boolean>;

  beforeEach(() => {
    mockTaskHandlerParser = jest.fn().mockReturnValue({});
    mockLocationResolver = jest.fn();
    mockTaskGroupResolver = jest.fn().mockResolvedValue({});
    mockCheckSystemDependencyFn = jest.fn().mockReturnValue(false);
    scanner = new WorkflowDepsScanner(
      mockTaskHandlerParser,
      mockLocationResolver,
      mockTaskGroupResolver,
      mockCheckSystemDependencyFn,
    );
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
    (mockTaskGroupResolver as jest.Mock).mockResolvedValue({ version: '1.0.0' });
    const handler = {
      name: 'handler1',
      version: '1.0.0',
      type: 'script',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        version: '1.0.0',
        requireVersion: '1.0.0',
        type: 'script',
      },
    ]);
  });

  it('handles missing version gracefully', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => false } as any);
    const handler = {
      name: 'handler1',
      version: '1.0.0',
      type: 'script',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        requireVersion: '1.0.0',
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
    const handler = {
      name: 'handler1',
      version: '2.0.0',
      type: 'package',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        version: '2.0.0',
        requireVersion: '2.0.0',
        type: 'package',
      },
    ]);
  });

  it('handles invalid version gracefully', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue('/path/to/handler1');
    jest.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: () => false } as any);
    (mockTaskGroupResolver as jest.Mock).mockRejectedValue(new Error('Invalid version'));
    const handler = {
      name: 'handler1',
      type: 'script',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
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
    (mockTaskGroupResolver as jest.Mock)
      .mockResolvedValueOnce({ version: '1.0.0' })
      .mockResolvedValueOnce({ version: '2.0.0' });
    const handler1 = {
      name: 'handler1',
      type: 'script',
    };
    const handler2 = {
      name: 'handler2',
      type: 'package',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValueOnce(handler1).mockReturnValueOnce(handler2);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler1,
        dependency: '/path/to/handler1',
        installed: true,
        incompatibleVersion: false,
        version: '1.0.0',
        type: 'script',
      },
      {
        name: 'task2',
        handler: handler2,
        dependency: '/path/to/handler2',
        installed: true,
        incompatibleVersion: false,
        version: '2.0.0',
        type: 'package',
      },
    ]);
  });

  it('sets installed to false when module is not found', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'handler1' } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue(null);
    const handler = {
      name: 'handler1',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
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
    const handler = {
      name: 'handler1',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
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
    const handler = {
      name: 'handler1',
      type: 'script',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
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
    const handler = {
      name: 'handler1',
      type: 'package',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
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
    const handler = {
      name: '@letrun/core',
      type: 'package',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
        dependency: '/path/to/@letrun/core',
        installed: true,
        incompatibleVersion: false,
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
    const handler = {
      name: '@letrun/core',
      type: 'package',
      version: '1.0.0',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
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
    const handler = {
      name: '@letrun/core',
      type: 'package',
      version: '^1.0.0',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
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

    const result = await scanner['tryGetNpmPackageVersion']({ name: packageName, version: packageVersion } as any);

    expect(result).toBe(packageVersion);
    expect(global.fetch).toHaveBeenCalledWith(`https://registry.npmjs.org/${packageName}`);
  });

  it('handles error when fetching npm package version', async () => {
    const packageName = 'some-package';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await scanner['tryGetNpmPackageVersion']({ name: packageName } as any);

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
    const handler = {
      name: 'some-package',
      type: 'package',
      version: '^1.0.0',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
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
    const rawHandler = '/this/is/invalid/package';
    const container: ContainerDef = { tasks: { task1: { handler: rawHandler } } } as any;
    (mockLocationResolver as jest.Mock).mockResolvedValue(null);
    global.fetch = jest.fn();
    const handler = {
      name: rawHandler,
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler,
        dependency: rawHandler,
        installed: false,
        incompatibleVersion: false,
      },
    ]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('identifies system dependencies using checkSystemDependencyFn', async () => {
    const container: ContainerDef = { tasks: { task1: { handler: 'system-handler' } } } as any;
    mockCheckSystemDependencyFn.mockImplementation((handler) => handler === 'system-handler');
    const handler = {
      name: 'system-handler',
    };
    (mockTaskHandlerParser as jest.Mock).mockReturnValue(handler);
    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: handler,
        installed: true,
        incompatibleVersion: false,
        type: 'system',
      },
    ]);
    expect(mockCheckSystemDependencyFn).toHaveBeenCalledWith('system-handler');
  });
});
