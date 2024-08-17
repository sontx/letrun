# Input Parameter Plugin

The Input Parameter Plugin allows us to parse or load raw input parameters into the desired format.

This plugin is using in the `run` command to parse the input parameters before executing the workflow/task.
You can create a custom plugin to handle the input parameters in a specific way, like support for another file format or custom parsing logic.

The default implementation supports JSON and YAML file as input or raw JSON string.

This plugin uses the `InputParameter` interface to define the input parameter logic.

## Usage

To create an Input Parameter Plugin, you need to implement the `InputParameter` interface and register your input parameter handler.

### Example

Here is an example of an Input Parameter Plugin:

```typescript
import { AbstractPlugin, INPUT_PARAMETER_PLUGIN, InputParameter } from '@letrun/core';
import fs from 'fs';
import { parse } from 'yaml';

export default class CustomInputParameter extends AbstractPlugin implements InputParameter {
  readonly name = 'custom';
  readonly type = INPUT_PARAMETER_PLUGIN;

  async read<T = any>(rawInput: string): Promise<T | null> {
    if (!rawInput) {
      return null;
    }

    if (URL.canParse(rawInput)) {
      const response = await fetch(rawInput);
      return response.json();
    }

    return JSON.parse(rawInput);
  }
}
```

### Registering the Plugin

To register the Input Parameter Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

The custom input parameter support the input as a URL or JSON string.

## Summary

The Input Parameter Plugin allows you to extend the CLI tool with custom input parameter handling logic using the `InputParameter` interface.
Implement the `InputParameter` interface, register your input parameter handler, and place the plugin in the appropriate directory to use it.
