# Run Workflow Task

The Run Workflow Task allows you to run another workflow within the current workflow.
This task is useful for modularizing workflows and reusing them.

## Usage

To use the Run Workflow Task, you need to define it in your workflow file and specify the workflow to run and any input parameters.

### Example

Here is an example of a Run Workflow Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "run_sub_workflow",
      "handler": "run-workflow",
      "parameters": {
        "file": "path/to/sub-workflow.json",
        "input": {
          "param1": "value1"
        }
      }
    }
  ]
}
```

### Parameters

- `file`: The file path to the workflow to run. This is required if `workflow` is not provided.
- `workflow`: The workflow object, workflow definition object, or their text content to run. This is required if `file` is not provided.
- `input`: The input to pass to the workflow. This is optional.

## Output

The Run Workflow Task will execute the specified workflow and return its output.
The output of the sub-workflow is the output of the Run Workflow Task.

## Summary

The Run Workflow Task allows you to run another workflow within the current workflow.
Define the workflow using the `file` or `workflow` parameter, and specify any input parameters using the `input` parameter.
