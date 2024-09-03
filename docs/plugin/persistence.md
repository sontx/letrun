# Persistence Plugin

The Persistence Plugin allows us to persist data to a storage. This plugin uses the `Persistence` interface to define persistence units.

The default implementation is file-based persistence, but you can create custom persistence plugins to store data in other storage systems.

## Usage

To create a Persistence Plugin, you need to implement the `Persistence` interface and register your persistence units.

### Example

Here is an example of an in-memory Persistence Plugin

```typescript
import { AbstractPlugin, Persistence, PERSISTENCE_PLUGIN, PersistenceUnit } from '@letrun/core';

class InMemoryPersistenceUnit implements PersistenceUnit {
  constructor(private storage: Record<string, any>) {}

  async save(key: string, value: any) {
    this.storage[key] = value;
  }

  async load(key: string) {
    return this.storage[key];
  }

  async remove(key: string) {
    delete this.storage[key];
  }

  async list() {
    return Object.keys(this.storage);
  }
}

export default class InMemoryPersistence extends AbstractPlugin implements Persistence {
  readonly name = 'inmemory-persistence';
  readonly type = PERSISTENCE_PLUGIN;

  private storage: Record<string, any> = {};

  getUnit(name: string): PersistenceUnit {
    if (!this.storage[name]) {
      this.storage[name] = {};
    }
    return new InMemoryPersistenceUnit(this.storage[name]);
  }
}
```

### Registering the Plugin

To register the Persistence Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

The Persistence Plugin allows you to persist data to in-memory storage.

## Summary

The Persistence Plugin allows you to extend the CLI tool with custom persistence functionality using the `Persistence` interface.
Implement the `Persistence` interface, register your persistence units, and place the plugin in the appropriate directory to use it.
