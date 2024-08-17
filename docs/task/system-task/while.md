# While Task

The While Task allows you to loop through tasks until a specified condition is met.
This task is useful for repeating a set of tasks based on a condition.

This is similar to the `while` loop in programming languages, where you can execute a block of code repeatedly as long as a specified condition is true.

## Usage

To use the While Task, you need to define it in your workflow file and specify the condition and the tasks to execute in each iteration.

> You can't define a `tasks` field in the While Task. Instead, you should define the tasks in the `loopOver` field.

### Example

Here is an example of a While Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "loop_while",
      "handler": "while",
      "parameters": {
        "expression": "${input.value} < 10",
        "mode": "whileDo"
      },
      "loopOver": [
        {
          "name": "increment_value",
          "handler": "increment",
          "parameters": {
            "value": "${input.value}"
          }
        }
      ]
    }
  ]
}
```

### Parameters

- `expression`: The condition to evaluate. The loop will continue as long as this condition is true. The `expression` can be written in any language supported by the `Script Engine`, we support javascript and python by default.
- `mode`: The mode of the while loop. Supported values are:
  - `doWhile`: Execute tasks first, then check the condition (default).
  - `whileDo`: Check the condition first, then execute tasks.
- `language`: The language of the expression. Default is `javascript`.

### Tasks

- `loopOver`: An array of tasks to execute for each iteration.

> The task's name will be calculated based on the iteration index, see the [For Task](for.md) documentation for more details.

## Output

The While Task will loop through the specified tasks and execute them until the condition is no longer met.

The output of the While task will contain:

- `iteration`: The current iteration count starting from `0`.

There is a special task field is `loopOver` which is an array of tasks that were executed for each iteration.

## Summary

The While Task allows you to repeat a set of tasks based on a condition. Define the condition using the `expression` and `mode` parameters, and specify the tasks to execute in the `loopOver` array.
