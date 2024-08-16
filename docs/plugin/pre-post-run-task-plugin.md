# Pre/Post Run Task Plugin

The Pre/Post Run Task Plugin allows you to execute custom logic before or after running a task.
This plugin is useful for modifying tasks, validating inputs, saving results, sending notifications, etc.

## Usage

To create a Pre/Post Run Task Plugin, you need to implement the `ExecutablePlugin` interface and register your plugin.

### Example

Here is an example of a Pre-Run Task Plugin:

```typescript
import { AbstractPlugin, ExecutablePlugin, PRE_RUN_TASK_PLUGIN, Workflow, Task } from '@letrun/core';

export default class PreRunTaskPlugin extends AbstractPlugin implements ExecutablePlugin {
  readonly name = 'validate-task';
  readonly type = PRE_RUN_TASK_PLUGIN;

  async execute(input: { workflow: Workflow; task: Task }) {
    const { task } = input;
    if (!task.name.startsWith('collday-')) {
      throw new Error(`Task name must start with 'collday-'. Task name: ${task.name}`);
    }
  }
}
```

Here is an example of a Post-Run Task Plugin:

```typescript
import { AbstractPlugin, ExecutablePlugin, POST_RUN_TASK_PLUGIN, Task, Workflow } from '@letrun/core';
import fs from 'fs';

export default class PostRunTaskPlugin extends AbstractPlugin implements ExecutablePlugin {
  readonly name = 'save-successful-task';
  readonly type = POST_RUN_TASK_PLUGIN;

  async execute(input: { workflow: Workflow; task: Task; result: any; error: any }) {
    const { task, result } = input;
    if (!task.status === 'completed') {
      await fs.promises.writeFile(`./results/${task.name}.json`, JSON.stringify(result));
    }
  }
}
```

### Registering the Plugin

To register the Pre/Post Run Task Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

If any task is executed that does not start with `collday-`, the Pre-Run Task Plugin will throw an error.
And after the task is executed successfully, the Post-Run Task Plugin will save the result to a file in the `results` directory.

## Summary

The Pre/Post Run Task Plugin allows you to extend the CLI tool with custom logic before or after running tasks using the `ExecutablePlugin` interface.
Implement the `ExecutablePlugin` interface, register your plugin, and place it in the appropriate directory to use it.
