# Lambda Task

The Lambda Task allows you to evaluate a lambda expression.
This task is useful for executing dynamic scripts within your workflow.

## Usage

To use the Lambda Task, you need to define it in your workflow file and specify the expression or file containing the expression, along with any input parameters.

### Example

Here is an example of a Lambda Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "evaluate_expression",
      "handler": "lambda",
      "parameters": {
        "expression": "input.value * 2;",
        "input": {
          "value": 5
        },
        "language": "javascript"
      }
    }
  ]
}
```

Or evaluate a python script:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "evaluate_expression",
      "handler": "lambda",
      "parameters": {
        "file": "path/to/my_script.py",
        "input": {
          "value": 5
        }
      }
    }
  ]
}
```

### Parameters

- `expression`: The expression to evaluate. This is required if `file` is not provided.
- `file`: The file path to read the expression from. This is required if `expression` is not provided.
- `input`: The input to use when evaluating the expression. This is optional.
- `language`: The language to use when evaluating the expression. If the input is a file, we'll detect the language by the file's extension. Supported values are `javascript` and `python`. Default is `javascript`.

> The `expression` can be written in any language supported by the `Script Engine`.

## Output

The Lambda Task will evaluate the specified expression and return its output.

## Summary

The Lambda Task allows you to evaluate a lambda expression within your workflow.
Define the expression using the `expression` or `file` parameter, and specify any input parameters using the `input` parameter.
The `language` parameter allows you to choose the scripting language for the expression.
