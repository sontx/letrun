# Task Invoker Plugin

The Task Invoker Plugin allows us to invoke task handlers, which are used by the workflow runner plugin.

The default implementation of the task invoker supports invoke external task handlers and system task handlers.
For external task handlers are resolved from the tasks directory or an absolute path.

You can create a custom task invoker plugin to support additional task handlers or customize the task invocation logic,
like handling task dependencies or task retries.

This plugin uses the `TaskInvoker` interface to define the task invocation logic.

## Usage

To create a Task Invoker Plugin, you need to implement the `TaskInvoker` interface and register your task invoker.

### Example

Here is an example of a Task Invoker Plugin:

```typescript
import { AbstractPlugin, TASK_INVOKER_PLUGIN, TaskInvoker } from '@letrun/core';
import { TaskHandlerInput, TaskHandlerOutput, InvalidParameterError } from '@letrun/common';
import path from 'node:path';
import fs from 'fs';

export default class CustomTaskInvoker extends AbstractPlugin implements TaskInvoker {
  readonly name = 'custom';
  readonly type = TASK_INVOKER_PLUGIN;

  async invoke(input: TaskHandlerInput): Promise<TaskHandlerOutput> {
    const {
      task,
      session: { systemTasks },
      context,
    } = input;
    if (systemTasks[task.taskDef.handler]) {
      return await systemTasks[task.taskDef.handler]?.handle(input);
    }
    throw new Error("We don't support external task handlers yet ;)");
  }
}
```

### Registering the Plugin

To register the Task Invoker Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

For the example above, only system task handlers are supported. If the task handler is not a system task, an error message is displayed.

## Summary

The Task Invoker Plugin allows you to extend the CLI tool with custom task invocation logic using the `TaskInvoker` interface.
Implement the `TaskInvoker` interface, register your task invoker, and place the plugin in the appropriate directory to use it.
