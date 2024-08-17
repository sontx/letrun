# For Task

The For Task allows you to loop through a specified range and perform tasks.
This task is useful for iterating over a sequence of numbers and executing tasks for each iteration.

This is similar to the `for` loop in programming languages, where you can execute a block of code a specified number of times.

## Usage

To use the For Task, you need to define it in your workflow file and specify the range and step value.

> You can't define `tasks` field in the For Task. Instead, you should define the tasks in the `loopOver` field.

### Example

Here is an example of a For Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "loop_range",
      "handler": "for",
      "parameters": {
        "from": 1,
        "to": 5,
        "step": 1
      },
      "loopOver": [
        {
          "name": "log_iteration",
          "handler": "log",
          "parameters": {
            "message": "Iteration ${task.output.index}"
          }
        }
      ]
    }
  ]
}
```

### Parameters

- `from`: The starting value of the iterator. This is required.
- `to`: The ending value of the iterator. This is required.
- `step`: The step value to increment the iterator by each loop. Default is `1`.

### Tasks

- `loopOver`: An array of tasks to execute for each iteration.

> The task's name of tasks in the `loopOver` array will be suffixed with the iteration index.
> Task name in this case will be `log_iteration__0`, `log_iteration__1`, `log_iteration__2`, `log_iteration__3`, and `log_iteration__4`.
> For more details about the generated tasks, see the [Workflow Runner](../../plugin/workflow-runner.md) documentation.

## Output

The For Task will loop through the specified range and execute the tasks in the `loopOver` array for each iteration.

The output of the For task will contain:

- `index`: The current iteration index (starting from `from`).
- `iteration`: The current iteration value (starting from `0`).
- `from`: The starting value of the iterator.
- `to`: The ending value of the iterator.
- `step`: The step value to increment the iterator by each loop.

There is a special task field is `loopOver` which is an array of tasks that were executed for each iteration.

## Summary

The For Task allows you to iterate over a range of numbers and perform tasks for each iteration.
Define the range using the `from`, `to`, and `step` parameters, and specify the tasks to execute in the `loopOver` array.
