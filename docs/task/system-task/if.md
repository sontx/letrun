# If Task

The If Task allows you to execute tasks based on conditions.
This task is useful for controlling the flow of your workflow by executing different sets of tasks depending on whether a condition is met.

This is similar to the `if` statement in programming languages, where you can execute a block of code if a specified condition is true.

## Usage

To use the If Task, you need to define it in your workflow file and specify the condition and the tasks to execute if the condition is true or false.

> You can't define a `tasks` field in the If Task.
> Instead, you should use the `then` and `else` fields to specify the tasks to execute based on the condition.

### Example

Here is an example of an If Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "check_condition",
      "handler": "if",
      "parameters": {
        "left": "${input.value}",
        "operator": ">",
        "right": 10
      },
      "then": [
        {
          "name": "log_true",
          "handler": "log",
          "parameters": {
            "message": "Condition is true"
          }
        }
      ],
      "else": [
        {
          "name": "log_false",
          "handler": "log",
          "parameters": {
            "message": "Condition is false"
          }
        }
      ]
    }
  ]
}
```

### Parameters

- `left`: The left operand of the expression.
- `operator`: The operator to use in the expression. Supported operators are:
  - `==`: Equality with type coercion (=== in JavaScript) ⭐
  - `=`: Equality without type coercion (== in JavaScript) ⭐
  - `!=`, `<>`: Inequality ⭐
  - `>`: Greater than ⭐
  - `<`: Less than ⭐
  - `>=`: Greater than or equal to ⭐
  - `<=`: Less than or equal to ⭐
  - `in`: Membership (for strings, arrays or object (key check)) ⭐
  - `not in`: Non-membership (for strings, arrays or object (key check)) ⭐
  - `contains`: Contains (for strings or arrays) ⭐
  - `not contains`: Does not contain (for strings or arrays) ⭐
  - `matches regex`: Matches a regular expression (for strings) ⭐
  - `is empty`: Is empty (for strings, arrays or object)
  - `is not empty`: Is not empty (for strings, arrays or object)
  - `is defined`: Is defined (neither `undefined` nor `null`)
  - `is not defined`: Is not defined (either `undefined` or `null`)
  - `truly`, `is truly`: Is truly, javascript truthy, you know what I mean ;)
  - `falsy`, `is falsy`: Is falsy, javascript falsy, you know what I mean ;)
- `right`: The right operand of the expression. Only required for binary operators (masked with ⭐).

### Tasks

- `then`: An array of tasks to execute if the condition is true.
- `else`: An array of tasks to execute if the condition is false.

## Output

The If Task will evaluate the condition and execute the tasks specified in the `then` or `else` arrays based on whether the condition is true or false.

The result of the If task is the result of the condition evaluation.

## Summary

The If Task allows you to control the flow of your workflow by executing different sets of tasks based on conditions.
Define the condition using the `left`, `operator`, and `right` parameters, and specify the tasks to execute in the `then` and `else` arrays.
