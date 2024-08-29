# ModuleLocationResolver Plugin

The `ModuleLocationResolver` plugin is designed to resolve the location of modules within the system, usually from the task handlers.
It provides a consistent way to locate modules, whether they are specified by absolute paths, relative paths, or module names.

The default implementation will look up in this order:

1. If this is an absolute path, we will use it as is.
2. Resolve it from the current directory.
3. Resolve it from the runner directory.
4. Lookup in the custom modules' directory if specified.
5. Lookup in the node_modules directory (module name may be extracted from the package name: @letrun/core@0.0.1 -> @letrun/core).
6. Append the .js extension if missing, then look up in the custom modules' directory if specified.

## Usage

To create a `ModuleLocationResolver` plugin, you need to implement the `ModuleLocationResolver` interface and register your resolver plugin.

### Example

Here is an example of a `ModuleLocationResolver` plugin:

```typescript
import { AbstractPlugin, MODULE_LOCATION_RESOLVER_PLUGIN, resolveLocalModuleLocation } from '@letrun/core';
import fs from 'node:fs';
import path from 'node:path';

export default class DefaultModuleLocationResolver extends AbstractPlugin {
  readonly name = 'example';
  readonly type = MODULE_LOCATION_RESOLVER_PLUGIN;

  async resolveLocation(module: string, modulesDir?: string, throwsIfNotFound?: boolean) {
    if (fs.existsSync(module)) {
      return module;
    }

    if (modulesDir) {
      const modulePath = path.resolve(modulesDir, module);
      if (fs.existsSync(modulePath)) {
        return modulePath;
      }
    }

    if (throwsIfNotFound) {
      throw new Error(`Module not found: ${module}`);
    }

    return null;
  }
}
```

### Registering the Plugin

To register the `ModuleLocationResolver` plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

For the example above, the resolver checks if the module exists at the specified location or within the modules directory.
If the module is not found and `throwsIfNotFound` is set to `true`, an error is thrown.

## Summary

The `ModuleLocationResolver` plugin provides a standardized way to resolve module locations within the system.
By implementing this interface, you can customize the module resolution logic to fit your specific needs.
