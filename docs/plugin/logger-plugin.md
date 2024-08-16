# Logger Plugin

The Logger Plugin allows you to customize how the CLI tool logs messages.
This plugin uses the `LoggerPlugin` interface to define logger plugins.
Be aware that customizing the logger may affect the `Log Transport Plugin` because the `Log Transport Plugin` is registered by this plugin.

## Usage

To create a Logger Plugin, you need to implement the `LoggerPlugin` interface and register your logger.

### Example

Here is an example of a Logger Plugin using the simple console for logging:

```typescript
import { AbstractPlugin, LOG_TRANSPORT_PLUGIN, LOGGER_PLUGIN } from '@letrun/core';
import winston, { createLogger, format } from 'winston';

export default class SamplePlugin extends AbstractPlugin implements LoggerPlugin {
  name = 'sample-logger';
  type = LOGGER_PLUGIN;

  getLogger() {
    return {
      verbose: (message) => console.log(message),
      error: (message) => console.error(message),
      warn: (message) => console.warn(message),
      info: (message) => console.info(message),
      debug: (message) => console.debug(message),
    };
  }
}
```

### Registering the Plugin

To register the Logger Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

You can see different log behaviors based on the logger you implement. In the example above, the logger logs messages to the console.

## Summary

The Logger Plugin allows you to extend the CLI tool with custom logging functionality using the `LoggerPlugin` interface.
Implement the `LoggerPlugin` interface, register your logger, and place the plugin in the appropriate directory to use it.
