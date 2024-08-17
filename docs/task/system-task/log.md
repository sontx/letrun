# Log Task

The Log Task allows you to output messages or errors for debugging purposes.
This task is useful for logging information during the execution of your workflow.

## Usage

To use the Log Task, you need to define it in your workflow file and specify the log level and message.

### Example

Here is an example of a Log Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "log_message",
      "handler": "log",
      "parameters": {
        "level": "info",
        "message": "This is a log message"
      }
    }
  ]
}
```

### Parameters

- `level`: The log level for the message. Supported values are `debug`, `info`, `warn`, and `error`. Default is `info`.
- `message`: The message to log. This is required.

## Output

The Log Task will output the specified message at the specified log level.

## Summary

The Log Task allows you to output messages or errors for debugging purposes.
Define the log level using the `level` parameter and specify the message to log using the `message` parameter.
