# Task Structure

## Supported Fields

A task should have the following structure:

- `name`: The name of the task. This is required if it's defined in an array. We recommend using a unique name for each task and task name should contain only letters, numbers, and underscores.
- `title`: A brief description of the task. This is optional.
- `handler`: The name of the task handler aka task type. Please refer to the [Task Handler](task-handler.md) document for more details. This is required.
- `parameters`: An object that provides input and configuration for the task. This field supports interpolation, which means you can reference the output of other tasks or the workflow input. This field is optional.
- `ignoreError`: Whether to ignore errors during task execution and let other tasks continue running. This is optional.
- `tasks`: An array of tasks to be executed (will be executed orderly) or an object of tasks (will be executed concurrently). This is optional.
- `retryCount`: The number of times to retry the task if it fails (defaults to 3). This is optional.
- `retryStrategy`: The strategy to use for retrying the task (defaults to 'fixed'). This is optional.
- `retryDelaySeconds`: The delay between retries in seconds (defaults to 3 seconds). This is optional.

> For retrying configuration, they are inherited from the parent container (workflow or task) if not defined.

There are some special fields that depend on the handler:

- `then`, `else`: Tasks to execute when the handler is [If](system-task/if.md).
- `decisionCases`, `defaultCase`: Tasks to execute when the handler is [Switch](system-task/switch.md).
- `loopOver`: Tasks to execute when the handler is [For](system-task/for.md), [While](system-task/while.md), or [Iterate](system-task/iterate.md).
- `catch`, `finally`: Tasks to execute when the handler is [Catch](system-task/catch.md).

This is an example of a task definition:

```json
{
  "name": "log_message",
  "handler": "log",
  "parameters": {
    "message": "Hello, world!"
  }
}
```

## Task Handler Format

A task handler is a string that represents the task type.
It can be a built-in task or a custom task.
The task handler should be defined in the `handler` field.

The handler should follow the format: `type:identify[:task-name]`.

- `type`: The type of the task, it can be:
  - `package`: A task handler from a node package which is published to npm.
  - `external`: A task handler from an external node package which is not published.
  - `script`: A task handler from a standalone script file.
- `identify`: The identifier of the task handler, it can be:
  - The package name if the type is `package`. The version can be specified by using the `@` symbol, e.g. `@my-scope/my-task@1.0.0`.
  - The path to the node module if the type is `external`.
  - The path to the script file if the type is `script`.
- `task-name`: The name of the task handler, this is optional if the identify isn't a group task package.

> If the handler is a path, it will treat as a script task handler.

This is some valid task handler examples:

```text
package:@letrun-task/file@0.0.1:read
package:example-task

external:./tasks/example-task
script:./tasks/example-task.js
```

## Nested Tasks

You can nest tasks inside other tasks by defining the nested tasks in the `tasks` field. This is useful when you want to group tasks together.

> Almost tasks support the `tasks` field, except for the [If](system-task/if.md), [Switch](system-task/switch.md) tasks and loop tasks ([For](system-task/for.md), [While](system-task/while.md) and [Iterate](system-task/iterate.md)).
> These tasks support nested tasks by using other fields like `then`, `else`, `decisionCases`, `defaultCase`, `loopOver`.

Here is an example:

```json
{
  "name": "my_daily_life",
  "tasks": {
    "play_game": {
      "handler": "game.js"
    },
    "listen_to_music": {
      "handler": "music_player.js",
      "parameters": {
        "songName": "Baby Shark"
      },
      "tasks": [
        {
          "name": "download_song",
          "handler": "download.js",
          "parameters": {
            "url": "https://example.com/baby-shark.mp3"
          }
        },
        {
          "name": "copy_song",
          "handler": "copy.js",
          "parameters": {
            "source": "baby-shark.mp3",
            "destination": "music/baby-shark.mp3"
          }
        }
      ]
    }
  }
}
```

The nested tasks will be executed before the parent task, thus the execution order will be:

1. `download_song` and `play_game`
2. `copy_song` and `play_game` (may still run)
3. `listen_to_music` and `play_game` (may still run)

> Tasks in the `tasks` field will be executed concurrently or orderly based on the parent task's definition.
> See more in the [Run Tasks Orderly](../workflow/workflow-structure.md#run-tasks-orderly) and [Run Tasks Concurrently](../workflow/workflow-structure.md#run-tasks-concurrently) sections.
