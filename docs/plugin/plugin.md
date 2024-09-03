# Plugin

Plugins are used to extend the functionality of the CLI tool.

A plugin is a JavaScript file that exports default a class that implements the `Plugin` interface.
Plugins are stored in the `plugins` directory (by default), you can change the directory by setting the `plugin.dir` configuration.

## Lifecycle

A plugin has a lifecycle that consists of the following methods:

1. `load(context)`: This method is called when the plugin is loaded.
2. `ready(context)`: This method is called when all plugins are registered to the plugin manager. This is useful when the plugin needs to interact with other plugins. This is optional.
3. `unload()`: This method is called when the plugin is unloaded.

The execution order will be: `load` -> `ready` -> `unload`.

The `load` method will be called on demand when the plugin is needed.
If the `ready` method is implemented, it will be called after all plugins are registered, thus the `load` method will be called automatically.

If you use the `AbstractPlugin` class, you only need to specify the `name` and `type` fields as required.
There is `onConfigChange` method that will be called when the configuration is changed.
This is useful when the plugin needs to reload the configuration.

## Priority

You can control the priority of the plugin by setting the `priority` field in the plugin class.
Plugins are executed in descending order of priority.
In some cases, there is only one plugin that can handle the task, you can set the priority to a higher value or even to `Infinity`.

> System plugins have a priority of `-1`, thus any custom plugin without a priority (default is `0`) will have a higher priority than system plugins.

## Example

Here is an example of a custom plugin:

```ts
import { Plugin } from '@letrun/common';

export default class MyPlugin implements Plugin {
  readonly name = 'my-plugin';
  readonly type = 'command';

  /* there are other methods to implement depending on the type of the plugin */

  async load() {
    // initialize the plugin
  }

  async unload() {
    // clean up the plugin
  }
}
```

There is a predefined `AbstractPlugin` class that cover some common cases and reduce the repeated code.

```ts
import { AbstractPlugin } from '@letrun/core';

export default class MyPlugin extends AbstractPlugin {
  readonly name = 'my-plugin';
  readonly type = 'command';

  /* there are other methods to implement depending on the type of the plugin */
}
```

## Plugin List

There may be multiple plugins of the same type, so you can list all available plugins using the `letrun plugin list` command.
See the [plugin list command](../command/plugin-list.md) document for more details.

Here are supported plugin types:

1. [Command Plugin](command-plugin.md)
2. [Script Engine](script-engine.md)
3. [Logger Plugin](logger-plugin.md)
4. [Log Transport Plugin](log-transport-plugin.md)
5. [Parameter Interpolator](parameter-interpolator.md)
6. [Persistence](persistence.md)
7. [Input Parameter](input-parameter.md)
8. [Id Generator](id-generator.md)
9. [Task Invoker](task-invoker.md)
10. [Workflow Runner](workflow-runner.md)
11. [Pre/Post Run Workflow Plugin](pre-post-run-workflow-plugin.md)
12. [Pre/Post Run Task Plugin](pre-post-run-task-plugin.md)
13. [Module Location Resolver](module-location-resolver.md)
