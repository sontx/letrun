# Task Structure

## Supported Fields

A task should have the following structure:

- `name`: The name of the task. This is required if it's defined in an array. We recommend using a unique name for each task and task name should contain only letters, numbers, and underscores.
- `title`: A brief description of the task. This is optional.
- `handler`: The name of the task handler aka task type. Please refer to the [Task Handler](task-handler.md) document for more details. This is required.
- `parameters`: An object that provides input and configuration for the task. This field supports interpolation, which means you can reference the output of other tasks or the workflow input. This field is optional.
- `ignoreError`: Whether to ignore errors during task execution and let other tasks continue running. This is optional.
- `tasks`: An array of tasks to be executed (will be executed orderly) or an object of tasks (will be executed concurrently). This is optional.

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
