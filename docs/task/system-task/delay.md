# Delay Task

The Delay Task allows you to delay the execution of the workflow for a specified amount of time.
This task is useful for introducing pauses in your workflow.

## Usage

To use the Delay Task, you need to define it in your workflow file and specify the delay time and optional data to return after the delay.

### Example

Here is an example of a Delay Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "delay_execution",
      "handler": "delay",
      "parameters": {
        "time": "1s",
        "data": {
          "name": "John Doe",
          "age": 30
        }
      }
    }
  ]
}
```

### Parameters

- `time`: The time to delay. It can be a readable string (e.g., `1s`, `2m`, `3 hours`) or a number in milliseconds. This is required.
- `data`: The data to pass to the output after the delay. This is optional.

## Output

The Delay Task will delay the execution for the specified time and return the specified data after the delay.

## Summary

The Delay Task allows you to introduce pauses in your workflow by delaying execution for a specified amount of time.
Define the delay time using the `time` parameter and optionally specify the data to return using the `data` parameter.
