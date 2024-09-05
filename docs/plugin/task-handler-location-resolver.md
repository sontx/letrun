# TaskHandlerLocationResolver Plugin

The `TaskHandlerLocationResolver` plugin is designed to resolve the location of task handlers within the system.
It provides a consistent way to locate task handlers, whether they are specified by absolute paths, relative paths, or module names.

The default implementation will look up in this order:

1. If this type is `package`, we looked up in the node_modules directory, otherwise we stop immediately.
2. Resolve it directly if it's an absolute path.
3. Resolve it from the current directory.
4. Resolve it from the runner directory.
5. Lookup in the custom tasks directory (default is tasks directory).

## Usage

To create a `TaskHandlerLocationResolver` plugin, you need to implement the `TaskHandlerLocationResolver` interface and register your resolver plugin.

### Example

Here is an example of a `TaskHandlerLocationResolver` plugin:

```typescript
import { AbstractPlugin, TASK_HANDLER_LOCATION_RESOLVER_PLUGIN } from '@letrun/core';
import { ParsedHandler } from '@letrun/common';
import fs from 'node:fs';
import path from 'node:path';

export default class ExampleTaskHandlerLocationResolver extends AbstractPlugin {
  readonly name = 'example';
  readonly type = TASK_HANDLER_LOCATION_RESOLVER_PLUGIN;

  async resolveLocation(handler: ParsedHandler, throwsIfNotFound?: boolean) {
    if (fs.existsSync(handler.name)) {
      return handler.name;
    }

    if (throwsIfNotFound) {
      throw new Error(`Module not found: ${handler.name}`);
    }

    return null;
  }
}
```

### Registering the Plugin

To register the `TaskHandlerLocationResolver` plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

For the example above, the resolver checks if the task handler exists at the specified location or within the tasks directory.
If the handler is not found and `throwsIfNotFound` is set to `true`, an error is thrown.

## Summary

The `TaskHandlerLocationResolver` plugin provides a standardized way to resolve task handler locations within the system.
By implementing this interface, you can customize the module resolution logic to fit your specific needs.
