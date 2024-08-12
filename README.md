# @letrun/cli

A simple and efficient tool for running declarative workflows with ease.

## Table of Contents

- [Concepts](#concepts)
  - [Workflow](#concept-workflow)
  - [Task](#concept-task)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
  - [run](#run)
  - [workflow](#workflow-command)
    - [list](#workflow-list)
    - [view](#workflow-view)
    - [delete](#delete)
    - [clear](#clear)
  - [plugin](#plugin-command)
    - [list](#plugin-list)
    - [view](#plugin-view)
  - [task](#task-command)
    - [list](#task-list)
    - [view](#task-view)
    - [run](#task-run)
- [Plugin](#plugin)
  - [Command Plugin](#command-plugin)
  - [JavaScript Engine](#javascript-engine)
  - [Logger Plugin](#logger-plugin)
  - [Parameter Interpolator](#parameter-interpolator)
  - [Persistence](#persistence)
  - [Task Invoker](#task-invoker)
  - [Workflow Runner](#workflow-runner)
  - [Pre/Post Run Workflow Plugin](#pre-post-run-workflow-plugin)
  - [Pre/Post Run Task Plugin](#pre-post-run-task-plugin)
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

### run

Run a workflow.

```sh
letrun run <path> [options]
```

Alternatively, you can pass the workflow file directly to the command:

```sh
letrun <path> [options]
```

Arguments:

- `<path>`: Path to the workflow file either in JSON or YAML format.

Options:

- `-s, --save`: Whether to save the workflow after running it.
- `-o, --output <output>`: Output file which contains the result of the workflow.

### workflow <a id="workflow-command"></a>

Manage workflows.

#### list <a id="workflow-list"></a>

List all saved workflows.

```sh
letrun workflow list [options]
```

Options:

- `-m, --max <max>`: The maximum number of workflows to list (default: 30)
- `-o, --offset <offset>`: The offset to start listing workflows (default: 0)
- `-w, --with <with>`: With additional fields, e.g., id,status

#### view <a id="workflow-view"></a>

View a workflow.

```sh
letrun workflow view <pathOrId> [options]
```

Arguments:

- `<pathOrId>`: The path to the workflow file or the ID of the saved workflow.

Options:

- `-w, --with <with>`: Show additional fields, e.g., id,status

#### delete

Delete a saved workflow.

```sh
letrun workflow delete <id>
```

Arguments:

- `<id>`: The ID of the workflow to delete.

#### clear

Clear all saved workflows.

```sh
letrun workflow clear
```

### plugin <a id="plugin-command"></a>

Manage plugins.

#### list <a id="plugin-list"></a>

list all installed plugins.

```sh
letrun plugin list
```

#### view <a id="plugin-view"></a>

View a plugin.

```sh
letrun plugin view [options]
```

Options:

- `-n, --name <name>`: The name of the plugin to view.
- `-t, --type <type>`: The type of the plugin to view.

### task <a id="task-command"></a>

Manage tasks.

#### list <a id="task-list"></a>

List all tasks.

```sh
letrun task list [options]
```

Options:

- `-c, --custom`: List custom tasks only.
- `-s, --system`: List system tasks only.
- `-w, --with <with>`: Show additional fields, e.g., id,status

#### view <a id="task-view"></a>

view detail of a task.

```sh
letrun task view <name> [options]
```

Arguments:

- `<name>`: The name of the task to view.

Options:

- `-g, --group <group>`: Group of the task, use `.` if you want to search tasks that doesn't have a group.

#### run <a id="task-run"></a>

Run a task.

```sh
letrun task run <name> [options]
```

Arguments:

- `<name>`: The name of the task to run.

Options:

- `-i, --input <input>`: Input for the task, can be a file path or a JSON string.
- `-g, --group <group>`: Group of the task, use `.` if you want to search tasks that doesn't have a group.
- `-o, --output <output>`: Output file which contains the result of the task.

## Plugin

Plugins are used to extend the functionality of the CLI tool.
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

### Command Plugin

This plugin allows you to extend the CLI tool with custom commands. We're using `commander` package to define commands.
Please refer to this sample for more details: [sample-command-plugin.ts](plugin/src/sample-command-plugin.ts).

### JavaScript Engine

This plugin allows some tasks to run JavaScript code in a sandboxed environment. The code is executed in a separate process to prevent side effects.
Please refer to this default implementation for more details: [default-javascript-engine.ts](plugin/src/default-javascript-engine.ts).

### Logger Plugin

This plugin allows you to add more log transports which using `winston` package.
The default implementation logs messages to the [console](plugin/src/console-logger.ts).

### Parameter Interpolator

This plugin is used by the [workflow-runner](#workflow-runner) plugin to interpolate parameters values.
`Interpolation` is a process of replacing placeholders in a string with actual values which are used in expressions like `${task1.output.name}`.
The default implementation is [expression-parameter-interpolator.ts](plugin/src/expression-parameter-interpolator.ts).

### Persistence

This plugin is used to persist data to a storage. The default implementation uses a [file-based storage](plugin/src/file-persistence.ts).

### Task Invoker

This plugin is used to invoke task handlers which is used by the [workflow-runner](#workflow-runner) plugin.
Invoking is a process of resolve the task handler to a [task](#task) and call it with input values.

With the custom tasks, the default implementation will look up in this order:

1. If this is an absolute path, we will use it as is.
2. Resolve it from the current directory.
3. Resolve it from the runner directory, where `letrun` is placed.
4. Append the .js extension if missing, then look up in the custom tasks directory (default is tasks directory).

### Workflow Runner

This plugin is used to run workflows, control the execution flow, and handle errors.
This is the most complex plugin, and it's responsible for the core functionality of the CLI tool.
The default implementation is [default-workflow-runner.ts](plugin/src/default-workflow-runner.ts).

### Pre/Post Run Workflow Plugin

This plugin is used to run some jobs before or after running a workflow.
There may be multiple plugins, and they will be called in chain.

They must be implemented by [ExecutablePlugin](core/src/model.ts) interface.

#### Pre-run Workflow Plugin

Plugin type: `pre-workflow-run`.

Run jobs before running a workflow. You can use this to modify the workflow, validate input, etc.
If the output is a workflow, it will be used to run instead of the original one.

#### Post-run Workflow Plugin

Plugin type: `post-workflow-run`.

Run jobs after a workflow is terminated (completed/error). You can use this to save the result, send notifications, etc.
If the output is a workflow, it will be used to return instead of the original one.

### Pre/Post Run Task Plugin

This plugin is used to run some jobs before or after running a task.
There may be multiple plugins, and they will be called in chain.

They must be implemented by [ExecutablePlugin](core/src/model.ts) interface.

#### Pre-run Task Plugin

Plugin type: `pre-task-run`.

Run jobs before running a task. You can use this to modify the task, validate input, etc.

#### Post-run Task Plugin

Plugin type: `post-task-run`.

Run jobs after a task is terminated (completed/error). You can use this to save/modify the result, send notifications, etc.

## Task Handler

A task handler is a function that executes a task. There are two types of tasks: system tasks and custom tasks.

### System Tasks

[package.json](..%2F..%2Fxproject%2Fterraform%2Flambda%2Flibs%2Fcommon%2Fpackage.json)
System tasks are built-in tasks that come with the CLI tool. They are defined in the [system-task](src/system-task) directory.

1. `if`: Executes tasks based on conditions.
2. `switch`: Chooses tasks based on input values.
3. `for`: Loops through a specified range and performs tasks.
4. `while`: Loops through tasks until a condition is met.
5. `iterate`: Loops through a list of items and performs tasks.
6. `catch`: Handles errors during task execution.
7. `log`: Outputs messages or errors for debugging purposes.
8. `http`: Sends HTTP requests and processes responses.
9. `run-workflow`: Runs another workflow within the current workflow.

### Custom Tas[package.json](..%2F..%2Fxproject%2Fterraform%2Flambda%2Flibs%2Fcommon%2Fpackage.json)ks

Custom tasks are tasks that are defined by the user and loaded by the CLI dynamically, you can see more details in the [Task Invoker](#task-invoker) plugin.
They are written in JavaScript and implement from the [TaskHandler](core/src/model.ts) interface.
They should be placed in the `tasks` directory (by default), you can change the directory by setting the `task.dir` configuration.

A task handler should have the following structure:

- `name`: The name of the task.
- `description`: A brief description of the task, this is optional.
- `parameters`: An object that describes the input parameters of the task for showing help.
- `handler`: The function that executes the task.

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
