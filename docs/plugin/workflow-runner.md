# Workflow Runner Plugin

The Workflow Runner Plugin is responsible for executing workflows, controlling the execution flow, and handling errors.
This plugin is the core component of the CLI tool and ensures that tasks within a workflow are executed in the correct order and with proper error handling.

The default implementation supports the [Directed Acyclic Graph (DAG)](https://orkes.io/content/faqs/directed-acyclic-graph).
Since a workflow is a series of tasks that can connect in only a specific direction and cannot loop.

Can a workflow have loops and still be a DAG?

Yes, this is still a DAG because the loop is just shorthand for running the tasks inside the loop over and over again.
That means each time the loop runs, it generates a new series of tasks that can be represented as a DAG, so the path is directed forward and does not loop back on itself.

For example, the following workflow has a loop:

```text
task1
loop1
    loop_task2
    loop_task3
task4
```

If `loop1` loops 2 times, the generated tasks will be:

```text
task1
loop1
    loop_task2__1
    loop_task3__1
    loop_task2__2
    loop_task3__2
task4
```

## Usage

To create a Workflow Runner Plugin, you need to implement the `WorkflowRunner` interface and register your workflow runner.

### Example

Here is an example of a Workflow Runner Plugin:

```typescript
import {
  AbstractPlugin,
  WorkflowRunner,
  WorkflowRunnerInput,
  WORKFLOW_RUNNER_PLUGIN,
  Task,
} from '@letrun/core';

export default class CustomWorkflowRunner extends AbstractPlugin implements WorkflowRunner {
  readonly name = 'custom';
  readonly type = WORKFLOW_RUNNER_PLUGIN;

  async execute(input: WorkflowRunnerInput) {
    const taskList = Object.keys(input.workflow.tasks).map((key) => input.workflow.tasks[key]);
    let lastTaskResult = null;
    for (const task of taskList) {
      lastTaskResult = await this.executeTask(task);
    }
    return lastTaskResult;
  }
  
  private async executeTask(task: Task) {
    console.log(`Executing task: ${task.name}`);
    return task.name;
  }
}
```

### Registering the Plugin

To register the Workflow Runner Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

The custom workflow runner executes each task in the workflow sequentially and logs the task name. 
In the real-world scenario, you would replace the `executeTask` method with your custom logic to execute the task and use the Task Invoker plugin to invoke the task's handler.

Customize the Workflow Runner Plugin is not a common use case, but it can be useful if you need to implement custom logic for workflow execution.

## Summary

The Workflow Runner Plugin allows you to extend the CLI tool with custom workflow execution logic using the `WorkflowRunner` interface.
Implement the `WorkflowRunner` interface, register your workflow runner, and place the plugin in the appropriate directory to use it.
