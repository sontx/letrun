# Iterate Task

The Iterate Task allows you to loop through a list of items and perform tasks for each item.
This task is useful for iterating over arrays, maps, or sets and executing tasks for each element.

This is similar to the `for-each` loop in programming languages, where you can execute a block of code for each item in a collection.

## Usage

To use the Iterate Task, you need to define it in your workflow file and specify the items to iterate over.

> You can't define a `tasks` field in the Iterate Task. Instead, you should define the tasks in the `loopOver` field.

### Example

Here is an example of an Iterate Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "loop_items",
      "handler": "iterate",
      "parameters": {
        "items": [1, 2, 3, 4, 5]
      },
      "loopOver": [
        {
          "name": "log_item",
          "handler": "log",
          "parameters": {
            "message": "Item ${task.output.item}"
          }
        }
      ]
    }
  ]
}
```

### Parameters

- `items`: An array, map, or set of items to iterate over. This is required.

### Tasks

- `loopOver`: An array of tasks to execute for each item.

> The task's name will be calculated based on the iteration index, see the [For Task](for.md) documentation for more details.

## Output

The Iterate Task will loop through the specified items and execute the tasks in the `loopOver` array for each item.

The output of the Iterate task will contain:

- `iteration`: The current iteration count starting from `0`.
- `item`: The current item being processed.

There is a special task field `loopOver` which is an array of tasks that were executed for each iteration.

## Summary

The Iterate Task allows you to iterate over a list of items and perform tasks for each item.
Define the items using the `items` parameter, and specify the tasks to execute in the `loopOver` array.
