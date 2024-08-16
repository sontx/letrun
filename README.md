# @letrun/cli

A simple and efficient tool for running declarative workflows with ease.

## Table of Contents

- [Concepts](#concepts)
  - [Workflow](#concept-workflow)
  - [Task](#concept-task)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
- [Plugin](#plugin)
- [Task Handler](#task-handler)
  - [System Tasks](#system-tasks)
  - [Custom Tasks](#custom-tasks)
- [Configuration](#configuration)
- [Development](#development)
- [License](#license)

## Concepts

### Workflow <a id="concept-workflow"></a>

A workflow is a sequence of tasks that are executed in a specific order. It can be defined in a JSON or YAML file.

A workflow file should have the following structure:

- `name`: The name of the workflow. This is required.
- `tasks`: An array of tasks to be executed (will be executed orderly) or an object of tasks (will be executed concurrently). This is required.
- `input`: An object that provides input for the workflow. Other tasks can access this input using the `${input}` expression. This is optional.

This is an example of a workflow file:

```json
{
  "name": "sample",
  "tasks": [
    {
      "name": "log",
      "parameters": {
        "message": "Hello, world!"
      }
    }
  ]
}
```

### Task <a id="concept-task"></a>

A task is a unit of work that can be executed by the workflow.
A tasks can contain nested tasks, and it can be executed concurrently or orderly.

A task should have the following structure:

- `name`: The name of the task. This is required if it's defined in an array.
- `title`: A brief description of the task. This is optional.
- `handler`: The name of the task handler. This is required. Please refer to the [Task Handler](#task-handler) section for more details.
- `parameters`: An object that provides input and configuration for the task. This field supports interpolation, see the [Parameter Interpolator](#parameter-interpolator) section for more details.
- `ignoreError`: Whether to ignore errors during task execution and let other tasks continue running. This is optional.
- `then`: Tasks to execute when the handler is `if` and the condition is true. This is optional.
- `else`: Tasks to execute when the handler is `if` and the condition is false. This is optional.
- `decisionCases`: Decision cases containing case-task mappings, executed when the handler is `switch` and there is a matched case. This is optional.
- `defaultCase`: Tasks to execute when the handler is `switch` and there is no matched case. This is optional.
- `loopOver`: Tasks to execute when the handler is `for`, `while`, or `iterate`. This is optional.
- `catch`: Tasks to execute when the handler is `catch` and an error occurs. This is optional.
- `finally`: Tasks to execute when the handler is `catch` and after the catch tasks are executed. This is useful for cleanup resources. This is optional.
- `tasks`: An array of tasks to be executed (will be executed orderly) or an object of tasks (will be executed concurrently). This is optional.

This is an example of a task:

```json
{
  "name": "log_message",
  "title": "Log a message",
  "handler": "log",
  "parameters": {
    "message": "Hello, world!"
  }
}
```

The `handler` can refer to a custom task by:

- Define an absolute path to the task file.
- Define a relative path to the task file.
- Define a task name, the CLI tool will look up in the custom tasks directory (default is `tasks` directory).

> More details about look up custom tasks can be found in the [Task Invoker](#task-invoker) plugin.

This is an example of a task that refers to a custom task:

```json
{
  "name": "greeting",
  "title": "Say greeting",
  "handler": "path/to/greeting-task.js",
  "parameters": {
    "message": "Hello, world!"
  }
}
```

## Installation

Ensure you have [Node.js](https://nodejs.org/en/download/prebuilt-installer) (>=20) and npm (>=10) installed.

To install the CLI tool, run:

```sh
npm install -g @letrun/cli
```

Alternatively, you can download the standalone executable file from the [releases page](https://github.com/sontx/letrun/releases).

## Usage

```sh
letrun [command] [options]
```

## Commands

We have several commands to interact with the CLI tool:

```shell
letrun [command] [options]
```

- [run](docs/command/run): Execute a workflow defined in a JSON or YAML file.
- workflow: Manage saved workflows.
  - [show](docs/command/workflow-list): Show a list of saved workflows.
  - [view](docs/command/workflow-view): View the details of a saved workflow.
  - [delete](docs/command/workflow-delete): Delete a saved workflow.
  - [clear](docs/command/workflow-clear): Clear all saved workflows.
- plugin: Manage plugins.
  - [list](docs/command/plugin-list): List all available plugins.
  - [view](docs/command/plugin-view): View the details of a plugin.
- task: View custom tasks.
  - [list](docs/command/task-list): List all available system/custom tasks.
  - [view](docs/command/task-view): View the details of a system/custom task.
  - [run](docs/command/task-run): Run a task directly without a workflow.

## Plugin

Plugins are used to extend the functionality of the CLI tool.
All main features are implemented as plugins (system plugins), so any of them can be replaced or extended by custom plugins.

A plugin is a JavaScript file that exports default a class that implements the `Plugin` interface.
Plugins are stored in the `plugins` directory (by default), you can change the directory by setting the `plugin.dir` configuration.

```ts
import { Plugin } from '@letrun/core';

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

You can control the priority of the plugin by setting the `priority` field in the plugin class.
Plugins are executed in descending order of priority.
In some cases, there is only one plugin that can handle the task, you can set the priority to a higher value or even to `Infinity`.

> System plugins have a priority of `-1`, thus any custom plugin without a priority (default is `0`) will have a higher priority than system plugins.

All available plugins can be listed using the `letrun plugin list` command.

Here are supported plugin types:

1. [Command Plugin](docs/plugin/command-plugin.md)
2. [Script Engine](docs/plugin/script-engine.md)
3. [Logger Plugin](docs/plugin/logger-plugin.md)
4. [Log Transport Plugin](docs/plugin/log-transport-plugin.md)
5. [Parameter Interpolator](docs/plugin/parameter-interpolator.md)
6. [Persistence](docs/plugin/persistence.md)
7. [Input Parameter](docs/plugin/input-parameter.md)
8. [Id Generator](docs/plugin/id-generator.md)
9. [Task Invoker](docs/plugin/task-invoker.md)
10. [Workflow Runner](docs/plugin/workflow-runner.md)
11. [Pre/Post Run Workflow Plugin](docs/plugin/pre-post-run-workflow-plugin.md)
12. [Pre/Post Run Task Plugin](docs/plugin/pre-post-run-task-plugin.md)

## Task Handler

A task handler is a function that executes a task. There are two types of tasks: system tasks and custom tasks.

### System Tasks

System tasks are built-in tasks that come with the CLI tool. They are defined in the [system-task](packages/cli/src/system-task).

1. `if`: Executes tasks based on conditions.
2. `switch`: Chooses tasks based on input values.
3. `for`: Loops through a specified range and performs tasks.
4. `while`: Loops through tasks until a condition is met.
5. `iterate`: Loops through a list of items and performs tasks.
6. `catch`: Handles errors during task execution.
7. `log`: Outputs messages or errors for debugging purposes.
8. `http`: Sends HTTP requests and processes responses.
9. `run-workflow`: Runs another workflow within the current workflow.
10. `lambda`: Executes a lambda script (javascript or python).

### Custom Tasks

Custom tasks are tasks that are defined by the user and loaded by the CLI dynamically, you can see more details in the [Task Invoker](#task-invoker) plugin.
They are written in JavaScript and implement from the [TaskHandler](packages/core/src/model/task-handler.ts) interface.
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
    console.log(`Hello, ${message}!`);
  }
}
```

> If you write custom task in TypeScript, you need to compile and bundle it to JavaScript before using.

## Configuration

The CLI tool can be configured using a configuration file or reading from environment variables.
The configuration provider will look up in this order:

1. `letrun.json` in the runner directory.
2. `letrun.yaml` in the runner directory.
3. `letrun.yml` in the runner directory.
4. Lookup from environment variables.

> The lookup key can be JSON path format, e.g., `plugin.dir` will be either the `plugin.dir` field or `dir` field in `plugin` object in JSON format.
> The YAML format will be converted to JSON format before lookup.

When lookup a key, we will use the following priority: exact key -> uppercase key -> camelCase key -> kebab-case key.

The default configuration is:

```json
{
  "plugin": {
    "dir": "plugins"
  },
  "task": {
    "dir": "tasks"
  },
  "persistence": {
    "dir": "data"
  },
  "logger": {
    "level": "debug",
    "console": {
      "showMeta": true,
      "metaStrip": "timestamp,service",
      "showTimestamp": true,
      "timestampFormat": "HH:mm:ss.SSS",
      "inspectOptions": {
        "depth": -1,
        "colors": true,
        "maxArrayLength": -1,
        "breakLength": 120,
        "compact": -1
      }
    }
  },
  "interpolator": {
    "maxRecursionLevel": 10
  }
}
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/en/download/prebuilt-installer) (>=20)
- npm (>=10)

### Setup

1. Clone the repository:

```sh
git clone https://github.com/sontx/letrun.git
```

2. Install dependencies:

There are three projects `core`, `plugin` and `task` that need to be installed.

```sh
npm install
```

3. Build the projects:

There are three projects `core`, `plugin` and `task` that need to be built.

```sh
npm run build
```

4. Run the CLI tool:

```sh
npm start <command> [options]
```

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
