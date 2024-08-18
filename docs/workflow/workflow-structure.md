# Workflow Structure

## Supported Fields

A Workflow Definition should have the following structure:

- `name`: The name of the workflow. This is required.
- `tasks`: An array of tasks to be executed (will be executed orderly) or an object of tasks (will be executed concurrently). This is required.
- `input`: An object that provides input for the workflow. Other tasks can access this input using the `${input}` expression. You can pass the input when executing the workflow. This is optional.
- `retryCount`: The number of times to retry the task if it fails (defaults to 3). This is optional.
- `retryStrategy`: The strategy to use for retrying the task (defaults to 'fixed'). This is optional.
- `retryDelaySeconds`: The delay between retries in seconds (defaults to 3 seconds). This is optional.

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

## Run Tasks Orderly

If you define an array of tasks in the `tasks` field, they will be executed orderly.
The next task will be executed after the previous task is completed.

Here is an example:

```json
{
  "name": "vietnamese_life",
  "tasks": [
    {
      "name": "find_a_job",
      "handler": "find_job.js",
      "parameters": {
        "cv": "path/to/your_cv.pdf"
      }
    },
    {
      "name": "get_married",
      "handler": "log",
      "parameters": {
        "level": "error",
        "message": "You can't get married without a girlfriend!"
      }
    }
  ]
}
```

## Run Tasks Concurrently

If you define an object of tasks in the `tasks` field, they will be executed concurrently.

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
      }
    }
  }
}
```
