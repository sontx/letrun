import {
  InvalidParameterError,
  PluginManager,
  TaskGroup,
  TaskGroupMetadata,
  TaskHandler,
  UNCATEGORIZED_TASK_GROUP,
} from '@letrun/common';
import DefaultMetadataExtractor from '@src/default-metadata-extractor';
import { defaultTaskGroupResolver } from '@letrun/core';

const jest = import.meta.jest;

describe('DefaultMetadataExtractor', () => {
  let extractor: DefaultMetadataExtractor;
  let pluginManager: jest.Mocked<PluginManager>;

  beforeEach(() => {
    jest.resetAllMocks();

    extractor = new DefaultMetadataExtractor();
    pluginManager = {
      callPluginMethod: jest.fn(),
    } as any;
    (extractor as any).context = { getPluginManager: () => pluginManager };
  });

  it('extracts metadata successfully', async () => {
    const parsedHandler = { name: 'testHandler' };
    const taskGroupMetadata: TaskGroupMetadata = {
      name: 'testGroup',
      version: '1.0.0',
      description: 'A test task group',
      author: 'Author',
      type: 'script',
      tasks: [],
    };

    pluginManager.callPluginMethod.mockResolvedValue('test/location');
    jest.spyOn(defaultTaskGroupResolver, 'resolve').mockResolvedValue({
      ...taskGroupMetadata,
      tasks: {},
    });

    const result = await extractor.extract(parsedHandler as any);

    expect(result).toEqual(taskGroupMetadata);
  });

  it('throws InvalidParameterError when location is not found', async () => {
    const parsedHandler = { name: 'testHandler' } as any;

    pluginManager.callPluginMethod.mockResolvedValue(null);

    await expect(extractor.extract(parsedHandler)).rejects.toThrow(InvalidParameterError);
  });

  it('throws error when task group resolution fails', async () => {
    const parsedHandler = { name: 'testHandler' } as any;

    pluginManager.callPluginMethod.mockResolvedValue('test/location');
    jest.spyOn(defaultTaskGroupResolver, 'resolve').mockRejectedValue(new Error('Resolution failed'));

    await expect(extractor.extract(parsedHandler)).rejects.toThrow('Resolution failed');
  });

  it('resolves tasks correctly', async () => {
    const parsedHandler = { name: 'testHandler' };
    const taskGroupMetadata: TaskGroupMetadata = {
      name: 'testGroup',
      version: '1.0.0',
      description: 'A test task group',
      author: 'Author',
      type: 'script',
      tasks: [
        {
          name: 'task1',
          version: '1.0.0',
          description: 'First task',
          parameters: {},
          output: {},
        },
        {
          name: 'task2',
          version: '1.0.0',
          description: 'Second task',
          parameters: {},
          output: {},
        },
      ],
    };

    pluginManager.callPluginMethod.mockResolvedValue('test/location');
    jest.spyOn(defaultTaskGroupResolver, 'resolve').mockResolvedValue({
      ...taskGroupMetadata,
      tasks: {
        task1: {
          name: 'task1',
          version: '1.0.0',
          description: 'First task',
          parameters: {},
          output: {},
        },
        task2: {
          name: 'task2',
          version: '1.0.0',
          description: 'Second task',
          parameters: {},
          output: {},
        },
      } as any,
    });

    const result = await extractor.extract(parsedHandler as any);

    expect(result.tasks).toEqual([
      {
        name: 'task1',
        version: '1.0.0',
        description: 'First task',
        parameters: {},
        output: {},
      },
      {
        name: 'task2',
        version: '1.0.0',
        description: 'Second task',
        parameters: {},
        output: {},
      },
    ]);
  });

  it('resolves tasks with missing fields', async () => {
    const parsedHandler = { name: 'testHandler' };
    const taskGroupMetadata: TaskGroupMetadata = {
      name: 'testGroup',
      version: '1.0.0',
      description: 'A test task group',
      author: 'Author',
      type: 'script',
      tasks: [
        {
          name: 'task1',
          version: '1.0.0',
          description: 'First task',
        },
      ],
    };

    pluginManager.callPluginMethod.mockResolvedValue('test/location');
    jest.spyOn(defaultTaskGroupResolver, 'resolve').mockResolvedValue({
      ...taskGroupMetadata,
      tasks: {
        task1: {
          name: 'task1',
          version: '1.0.0',
          description: 'First task',
        },
      } as any,
    });

    const result = await extractor.extract(parsedHandler as any);

    expect(result.tasks).toEqual([
      {
        name: 'task1',
        version: '1.0.0',
        description: 'First task',
        parameters: undefined,
        output: undefined,
      },
    ]);
  });

  it('extracts metadata from TaskGroup successfully', async () => {
    const taskGroup: TaskGroup = {
      name: 'testGroup',
      version: '1.0.0',
      description: 'A test task group',
      author: 'Author',
      type: 'script',
      tasks: {
        task1: {
          name: 'task1',
          version: '1.0.0',
          description: 'First task',
          parameters: {},
          output: {},
          handle: () => {},
        },
      },
    };

    const result = await extractor.extract(taskGroup);

    expect(result).toEqual({
      name: 'testGroup',
      version: '1.0.0',
      description: 'A test task group',
      author: 'Author',
      type: 'script',
      tasks: [
        {
          name: 'task1',
          version: '1.0.0',
          description: 'First task',
          parameters: {},
          output: {},
        },
      ],
    });
  });

  it('extracts metadata from TaskHandler successfully', async () => {
    const taskHandler: TaskHandler = {
      name: 'taskHandler',
      version: '1.0.0',
      description: 'A test task handler',
      parameters: {},
      output: {},
      handle: jest.fn(),
    };

    const result = await extractor.extract(taskHandler);

    expect(result).toEqual({
      ...UNCATEGORIZED_TASK_GROUP,
      version: '1.0.0',
      description: 'A test task handler',
      type: 'script',
      tasks: [
        {
          name: 'taskHandler',
          version: '1.0.0',
          description: 'A test task handler',
          parameters: {},
          output: {},
        },
      ],
    });
  });

  it('throws InvalidParameterError when TaskHandler has no name', async () => {
    const taskHandler: TaskHandler = {
      handle: jest.fn(),
    };

    await expect(extractor.extract(taskHandler)).rejects.toThrow(InvalidParameterError);
  });
});
