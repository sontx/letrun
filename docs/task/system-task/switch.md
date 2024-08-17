# Switch Task

The Switch Task allows you to choose tasks based on input values.
This task is useful for controlling the flow of your workflow by executing different sets of tasks depending on the evaluated expression.

This is similar to the `switch` statement in programming languages, where you can choose different cases based on the value of an expression.

## Usage

To use the Switch Task, you need to define it in your workflow file and specify the expression to evaluate, the decision cases, and the default case.

> You can't define a `tasks` field in the Switch Task.
> Instead, you should use the `decisionCases` and `defaultCase` fields to specify the tasks to execute based on the evaluated expression.

### Example

Here is an example of a Switch Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "choose_case",
      "handler": "switch",
      "parameters": {
        "expression": "${input.value}",
        "language": "javascript"
      },
      "decisionCases": {
        "case1": [
          {
            "name": "log_case1",
            "handler": "log",
            "parameters": {
              "message": "Case 1 executed"
            }
          }
        ],
        "case2": [
          {
            "name": "log_case2",
            "handler": "log",
            "parameters": {
              "message": "Case 2 executed"
            }
          }
        ]
      },
      "defaultCase": [
        {
          "name": "log_default",
          "handler": "log",
          "parameters": {
            "message": "Default case executed"
          }
        }
      ]
    }
  ]
}
```

### Parameters

- `expression`: The expression to evaluate. The result of this expression will be matched with the target case. The `expression` can be written in any language supported by the `Script Engine`, we support javascript and python by default.
- `language`: The language of the expression. Default is `javascript`.

### Tasks

- `decisionCases`: An object containing case-task mappings. The tasks in the matched case will be executed.
- `defaultCase`: An array of tasks to execute if no case matches the evaluated expression. The default case is not required, but it is recommended to handle cases where no case matches the evaluated expression.

## Output

The Switch Task will evaluate the expression and execute the tasks specified in the matched case or the default case if no case matches.

The result of this task will be the evaluated expression result.

## Summary

The Switch Task allows you to control the flow of your workflow by choosing tasks based on input values.
Define the expression using the `expression` and `language` parameters, and specify the tasks to execute in the `decisionCases` and `defaultCase` properties.
