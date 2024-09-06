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
They are written in JavaScript and implement from the [TaskHandler](../../packages/common/src/model/task-handler.ts) interface.

You can write custom tasks either in a simple JS file or a node package:

1. Simple JS file
   - A single JS file that exports default a class that implements the `TaskHandler` interface.
   - In case you need to use external libraries, you must bundle them into a single file by using tools like Webpack, Rollup or esbuild.
   - They should be placed in the `tasks` directory (by default), you can change the directory by setting the `task.dir` configuration.
   - The file extension should be either `.js`, `.mjs` for ESM module or `.cjs` for CommonJS module.
2. Node package
   - A node package that exports a default class that implements the `TaskHandler` interface.
   - The entry point should be defined in the `main` field in `package.json`.
   - The package should be published to npm or a private registry.
   - We recommend you use scoped package and name the package with `@letrun-task-` prefix.
   - You can install the package using `letrun task install <package-name>` command.
   - We also support you place the package in the `tasks` directory manually.

A task handler should have the following structure:

- `name`: The name of the task, this is optional. We'll use the file name or package name as the task name if not defined.
- `description`: A brief description of the task, this is optional.
- `version`: The version of the task, this is optional. We'll use the package version if not defined.
- `parameters`: An object that describes the input parameters of the task for showing help. (calls `Schema.describe()` from Joi)
- `handle`: The function that executes the task. This is required.

There are alternative ways to define those fields by using these corresponding decorators:

- `@Name`: The name of the task.
- `@Description`: A brief description of the task.
- `@Version`: The version of the task.
- `@Parameters`: An object that describes the input parameters of the task for showing help.

> _Vanilla JS_ does not support decorators yet, so you need to use Babel or TypeScript to work with them.

This is an example of a custom task:

```ts
import { validateParameters, Name, Parameters } from '@letrun/core';
import { TaskHandler } from '@letrun/common';
import Joi from 'joi';

interface TaskParameters {
  message: string;
}

const Schema = Joi.object<TaskParameters>({
  message: Joi.string().description('The message to say greeting').required(),
});

@Name('greeting')
@Parameters(Schema)
export default class GreetingTaskHandler implements TaskHandler {
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
import { validateParameters, Name, Parameters } from '@letrun/core';
import { TaskHandler } from '@letrun/common';
import Joi from 'joi';

interface TaskParameters {
  value: string;
}

const Schema = Joi.object<TaskParameters>({
  value: Joi.string().description('The string to uppercase').required(),
});

@Name('uppercase')
@Parameters(Schema)
export default class UppercaseTaskHandler implements TaskHandler {
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

## Task Group

A task group is a collection of tasks that are grouped together.
It is useful when you have a set of tasks that are related to each other.

Currently, we support grouping tasks by placing them in subdirectories or multiple exported classes in a node package.

### Subdirectory

You can group tasks by placing them in subdirectories. The group name will be the directory name.
The only one level of nesting is supported, so you can't nest a group inside another group.

Here is an example of a task group:

```
tasks/
└── my-group
    ├── task1.js
    └── task2.js
```

The task's handler will follow this format `script:group-name/script-file`.
For example, the handler for `task1.js` will be `script:my-group/task1.js`.

> This approach is limited to simple tasks.
> If you need to use external libraries, we recommend you create a node package.

### Node Package

You can group tasks by exporting multiple classes in a node package.
The group name will be the package name.

Here is an example of a task group:

**package.json**

```json
{
  "name": "my-group",
  "version": "1.0.0",
  "main": "index.js"
}
```

**index.js**

```js
export class Task1Handler {
  name = 'task1';
  handle() {
    console.log('Task 1');
  }
}

export class Task2Handler {
  name = 'task2';
  handle() {
    console.log('Task 2');
  }
}
```

The task's handler will follow this format `package:package-name:task-name`.
For example, the handler for `Task1Handler` will be `package:my-group:task1`.

The group information will be obtained from the package.json:

- `name`: The name of the task group.
- `description`: A brief description of the task group.
- `version`: The version of the task group.
- `author`: The author of the task group.

> We recommend you use scoped package and name the package with `@letrun-task-` prefix.
