# Catch Task

The Catch Task allows you to handle errors during task execution.
This task is useful for managing errors and executing specific tasks when an error occurs.

This similar to try-catch block in programming languages where you can catch the error and execute specific tasks.

## Usage

To use the Catch Task, you need to define it in your workflow file and specify the error handling conditions and the tasks to execute in the catch and finally blocks.

### Example

Here is an example of a Catch Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "safe_task",
      "handler": "catch",
      "tasks": [
        {
          "name": "business_logic",
          "handler": "shell",
          "parameters": {
            "command": "echo 'Hello, World!'"
          }
        }
      ],
      "catch": [
        {
          "name": "handle_error",
          "handler": "log",
          "parameters": {
            "message": "An error occurred: ${task.output.error.message}"
          }
        }
      ],
      "finally": [
        {
          "name": "cleanup",
          "handler": "cleanup.js"
        }
      ]
    }
  ]
}
```

### Parameters

- `errorName`: The error name to match against the caught error if the catch is executed. This is optional.
- `expression`: The script expression to evaluate to determine if the catch should be executed. The `expression` can be written in any language supported by the `Script Engine`, we support javascript and python by default. This is optional.
- `language`: The language of the expression. Default is `javascript`.

### Tasks

- `catch`: An array of tasks to execute when an error occurs.
- `finally`: An array of tasks to execute after the catch block, regardless of whether an error occurred.

> Thus, the `catch` and `finally` blocks are optional, but at least one of them must be specified.

## Output

The Catch Task will handle errors during task execution and execute the tasks specified in the `catch` and `finally` arrays based on the error handling conditions.

The output contains these fields:

- `error`: The error object that was caught.
- `handledBlocks`: The blocks that were executed. This can be `catch`, `finally`, or both.

## Summary

The Catch Task allows you to manage errors during task execution by specifying error handling conditions and tasks to execute in the catch and finally blocks. Define the error handling conditions using the `errorName`, `expression`, and `language` parameters, and specify the tasks to execute in the `catch` and `finally` arrays.
