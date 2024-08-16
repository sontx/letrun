# Pre/Post Run Workflow Plugin

The Pre/Post Run Workflow Plugin allows you to execute custom logic before or after running a workflow.
This plugin is useful for modifying workflows, validating inputs, saving results, sending notifications, etc.

## Usage

To create a Pre/Post Run Workflow Plugin, you need to implement the `ExecutablePlugin` interface and register your plugin.

### Example

Here is an example of a Pre-Run Workflow Plugin:

```typescript
import { AbstractPlugin, ExecutablePlugin, PRE_RUN_WORKFLOW_PLUGIN, Workflow } from '@letrun/core';

export default class PreRunWorkflowPlugin extends AbstractPlugin implements ExecutablePlugin {
  readonly name = 'validate-workflow';
  readonly type = PRE_RUN_WORKFLOW_PLUGIN;

  async execute(input: { workflow: Workflow }) {
    const { workflow } = input;
    if (!workflow.name.startsWith('coolday-')) {
      throw new Error('Workflow name must start with "coolday-"');
    }
  }
}
```

Here is an example of a Post-Run Workflow Plugin:

```typescript
import { AbstractPlugin, ExecutablePlugin, POST_RUN_WORKFLOW_PLUGIN, Workflow } from '@letrun/core';
import fs from 'fs';

export default class PostRunWorkflowPlugin extends AbstractPlugin implements ExecutablePlugin {
  readonly name = 'save-successful-workflow';
  readonly type = POST_RUN_WORKFLOW_PLUGIN;

  async execute(input: { workflow: Workflow; result: any; error: any }) {
    const { workflow, result } = input;
    if (workflow.status === 'completed') {
      await fs.promises.writeFile(`./results/${workflow.name}.json`, JSON.stringify(result));
    }
  }
}
```

### Registering the Plugin

To register the Pre/Post Run Workflow Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

Whenever a workflow is run, it'll be failed if the workflow name does not start with `coolday-`.
If the workflow is successful, the result will be saved to a file in the `results` directory.

## Summary

The Pre/Post Run Workflow Plugin allows you to extend the CLI tool with custom logic before or after running workflows using the `ExecutablePlugin` interface.
Implement the `ExecutablePlugin` interface, register your plugin, and place it in the appropriate directory to use it.
