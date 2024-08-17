# Script Engine Plugin

The Script Engine Plugin allows you to customize the expression evaluation in the CLI tool.
You can add more Script Engine Plugins to provide additional supported script languages such as golang, c#, java...
This plugin uses the `ScriptEngine` interface to define script engines.

Currently, we support JavaScript (default) and Python script engines.

There are known limitations with the Python script engine:

- The context wil be loaded into a `context` variable as a dictionary in the evaluation script.
- The output should be assigned to a variable named `output` in the evaluation script.
- Python should be installed on the system to use the Python script engine. If the python executable is not in the system path, you can configure the `script-engine.python.pythonPath` to the python executable path.

There are several built-in tasks that support expression evaluation: `while`, `catch`, `switch` and `lambda`.

## Usage

To create a Script Engine Plugin, you need to implement the `ScriptEngine` interface and register your script engine.

### Example

Here is an example of a Script Engine Plugin for JavaScript:

```typescript
import { AbstractPlugin, SCRIPT_ENGINE_PLUGIN, ScriptEngine, ObjectType } from '@letrun/core';
import vm from 'vm';

export default class JavascriptEngine extends AbstractPlugin implements ScriptEngine {
  readonly name = 'javascript';
  readonly type = SCRIPT_ENGINE_PLUGIN;

  async run(script: string, context: ObjectType) {
    if (!script) {
      return undefined;
    }

    const val = vm.runInNewContext(script, context);
    return val instanceof Promise ? await val : val;
  }

  support(extension: string): boolean {
    return extension === 'js';
  }
}
```

### Registering the Plugin

To register the Script Engine Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

All tasks that support expression evaluation will be able to use the registered script engine if configured.
For example, you can use the JavaScript script engine to evaluate JavaScript expressions if the task expression's language is set to `javascript`.

## Summary

The Script Engine Plugin allows you to extend the CLI tool with custom script engines using the `ScriptEngine` interface.
Implement the `ScriptEngine` interface, register your script engine, and place the plugin in the appropriate directory to use it.
