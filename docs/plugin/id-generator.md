# Id Generator Plugin

The Id Generator Plugin allows us to generate unique IDs for tasks and retrieve parent IDs from given IDs.

The default ID generator uses a simple counter to generate IDs.

This plugin uses the `IdGenerator` interface to define the ID generation logic.

## Usage

To create an Id Generator Plugin, you need to implement the `IdGenerator` interface and register your ID generator.

### Example

Here is an example of an Id Generator Plugin:

```typescript
import { AbstractPlugin, ID_GENERATOR_PLUGIN, IdGenerator } from '@letrun/core';

export default class CustomIdGenerator extends AbstractPlugin implements IdGenerator {
  name = 'custom';
  type = ID_GENERATOR_PLUGIN;

  private idSeparator = '-';
  private freeId = 0;

  generateId(parentId?: string): string {
    return parentId ? `${parentId}${this.idSeparator}${this.freeId++}` : `${this.freeId++}`;
  }

  getParentId(id: string): string | undefined {
    return id?.substring(0, id.lastIndexOf(this.idSeparator));
  }
}
```

### Registering the Plugin

To register the Id Generator Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

The `CustomIdGenerator` plugin will generate IDs with a `-` separator for parent IDs.

## Summary

The Id Generator Plugin allows you to extend the CLI tool with custom ID generation logic using the `IdGenerator` interface.
Implement the `IdGenerator` interface, register your ID generator, and place the plugin in the appropriate directory to use it.
