# Task Handler

A task handler is a function that executes a task. There are two types of tasks: system tasks and custom tasks.

A task handler should follow certain basic principles:

1. Handler are stateless and do not implement a workflow specific logic.
2. Each handler executes a very specific task and produces well-defined output given specific inputs.
3. Handlers are meant to be idempotent (or should handle cases where the task that partially executed gets rescheduled due to timeouts etc.)
4. Handlers do not implement the logic to handle retries etc., that is taken care by the runner.

## System Tasks

System tasks are built-in tasks that come with the CLI tool. They are defined in the [system-task](../../packages/engine/src/system-task).

To show all available system tasks, you can use the `letrun task list -s` command.

Here the full list of system tasks:

- [If](system-task/if.md): execute tasks based on conditions.
- [Switch](system-task/switch.md): choose tasks based on input values.
- [For](system-task/for.md): loop through a specified range and perform tasks.
- [While](system-task/while.md): loop through tasks while a condition is true.
- [Iterate](system-task/iterate.md): iterate over an array and perform tasks.
- [Catch](system-task/catch.md): handle errors in tasks.
- [Log](system-task/log.md): output messages or errors for debugging purposes.
- [Run Workflow](system-task/run-workflow.md): run another workflow within the current workflow.
- [Lambda](system-task/lambda.md): execute a lambda function such as JavaScript or Python code.
- [Http](system-task/http.md): make an HTTP request and process the response.
- [Delay](system-task/delay.md): pause the workflow for a specified duration.

## Custom Tasks

Custom tasks are tasks that are defined by the user and loaded by the CLI dynamically.
They are written in JavaScript and implement from the [TaskHandler](../../packages/core/src/model/task-handler.ts) interface.
They should be placed in the `tasks` directory (by default), you can change the directory by setting the `task.dir` configuration.

A task handler should have the following structure:

- `name`: The name of the task.
- `description`: A brief description of the task, this is optional.
- `parameters`: An object that describes the input parameters of the task for showing help.
- `handle`: The function that executes the task.

We support grouping tasks by placing them in subdirectories, the group name will be the directory name.

This is an example of a custom task:

```ts
import { TaskHandler, validateParameters } from '@letrun/core';
import Joi from 'joi';

interface TaskParameters {
  message: string;
}

const Schema = Joi.object<TaskParameters>({
  message: Joi.string().description('The message to say greeting').required(),
});

export default class GreatingTaskHandler implements TaskHandler {
  name = 'greeting';
  parameters = Schema.describe();

  async handle({ task }: TaskHandlerInput) {
    const { message } = validateParameters(task.parameters, Schema);
    const effectiveMessage = `Hello, ${message}!`;
    console.log(effectiveMessage);
    return effectiveMessage;
  }
}
```

Here is another example that will uppercase the input string:

```ts
import { TaskHandler, validateParameters } from '@letrun/core';
import Joi from 'joi';

interface TaskParameters {
  value: string;
}

const Schema = Joi.object<TaskParameters>({
  value: Joi.string().description('The string to uppercase').required(),
});

export default class UppercaseTaskHandler implements TaskHandler {
  name = 'uppercase';
  parameters = Schema.describe();

  async handle({ task }: TaskHandlerInput) {
    const { value } = validateParameters(task.parameters, Schema);
    return value.toUpperCase();
  }
}
```

Finally, use the custom tasks in the workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "say_hello",
      "handler": "greeting",
      "parameters": {
        "message": "world"
      }
    },
    {
      "name": "uppercase_greeting",
      "handler": "uppercase",
      "parameters": {
        "value": "${say_hello.output}"
      }
    }
  ]
}
```

The output of the workflow will be: `HELLO, WORLD!`.

> If you write custom task in TypeScript, you need to compile and bundle it to JavaScript before using.

To show all available custom tasks, you can use the `letrun task list -c` command.
