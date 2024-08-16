# Log Transport Plugin

The Log Transport Plugin allows you to add custom log transports to the CLI tool.
This is useful if you want to send logs to a remote server, a file, etc.
The default `Logger Plugin` supports the `winston` log transport.

This plugin uses the `LogTransportPlugin` interface to provide a new log transport.

## Usage

To create a Log Transport Plugin, you need to implement the `LogTransportPlugin` interface and register your transport.

### Example

Here is an example of a Log Transport Plugin that sends error logs to a file:

```typescript
import { AbstractPlugin, LOG_TRANSPORT_PLUGIN, LogTransportPlugin } from '@letrun/core';
import { transports } from 'winston';

export default class CustomLogTransportPlugin extends AbstractPlugin implements LogTransportPlugin {
  readonly name = 'file-transport';
  readonly type = LOG_TRANSPORT_PLUGIN;

  getTransport(): Transport {
    return new transports.File({ filename: 'error.log', level: 'error' });
  }
}
```

### Registering the Plugin

To register the Log Transport Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

The output of the `CustomLogTransportPlugin` will be a file named `error.log` that contains only error logs.

## Summary

The Log Transport Plugin allows you to extend the CLI tool with custom logging transports using the `LogTransportPlugin` interface.
Implement the `LogTransportPlugin` interface, register your transport, and place the plugin in the appropriate directory to use it.
