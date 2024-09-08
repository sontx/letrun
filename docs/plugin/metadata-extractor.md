# Metadata Extractor Plugin

The `Metadata Extractor Plugin` is used to extract metadata from either a task handler string or a task group or a parsed handler.
These extracted metadata can be used to generate documentation or to provide additional information about the task handler or task group.

> The metadata is always a [TaskGroupMetadata](../../packages/common/src/model/task-group.ts) object.

## Usage

To use the `Metadata Extractor Plugin`, you need to implement the `MetadataExtractorPlugin` interface and register the plugin with the CLI tool.

### Example

Here is an example of a Metadata Extractor Plugin:

```typescript
import { AbstractPlugin, METADATA_EXTRACTOR, MetadataExtractor } from '@letrun/core';
import { Command } from 'commander';
import art from './art';
import { ParsedHandler, TaskGroup, TaskGroupMetadata, TaskHandler } from '@letrun/common';
import is from '@sindresorhus/is';
import undefined = is.undefined;

export default class ExampleExtractMetadata extends AbstractPlugin implements MetadataExtractor {
  readonly name = 'example';
  readonly type = METADATA_EXTRACTOR;

  async extract(parsedHandler: ParsedHandler | TaskGroup | TaskHandler): Promise<TaskGroupMetadata> {
    return {
      name: 'Example Metadata',
      description: 'This is an example metadata',
      tasks: [],
    };
  }
}
```

### Registering the Plugin

To register the Metadata Extractor Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

This example above will always return the same metadata for any task handler or task group.

## Summary

This plugin is used internally by the CLI tool to extract metadata from task handlers and task groups.
You can implement your own Metadata Extractor Plugin to add more additional metadata to the task handlers or task groups or do whatever you want with the metadata.
