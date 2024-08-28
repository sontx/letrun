import { WorkflowDepsScanner } from '@src/libs/workflow-deps-scanner';
import { ContainerDef } from '@src/model';
import { ModuleResolverFn } from '@src/libs/module-resolver';
import fs from 'node:fs';
import { LocationResolverFn } from '@src/plugin';

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
        version: '0.0.0',
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
        version: 'Invalid version: Invalid version',
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
      .mockResolvedValueOnce(class { version = '1.0.0'; })
      .mockResolvedValueOnce(class { version = '2.0.0'; });

    const result = await scanner.scan(container);

    expect(result).toEqual([
      {
        name: 'task1',
        handler: 'handler1',
        dependency: '/path/to/handler1',
        installed: true,
        version: '1.0.0',
        type: 'script',
      },
      {
        name: 'task2',
        handler: 'handler2',
        dependency: '/path/to/handler2',
        installed: true,
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
        version: '0.0.0',
        type: undefined,
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
        version: '0.0.0',
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
        version: '0.0.0',
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
        installed: true,
        version: '1.0.0',
        type: 'package',
      },
    ]);
  });
});
