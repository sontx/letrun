# HTTP Task

The HTTP Task allows you to send HTTP requests and process responses.
This task is useful for interacting with web services and APIs within your workflow.

## Usage

To use the HTTP Task, you need to define it in your workflow file and specify the request parameters.

### Example

Here is an example of an HTTP Task in a workflow file:

```json
{
  "name": "sample-workflow",
  "tasks": [
    {
      "name": "send_request",
      "handler": "http",
      "parameters": {
        "url": "https://jsonplaceholder.typicode.com/todos/1"
      }
    }
  ]
}
```

### Parameters

- `url`: The URL endpoint to send the request. This is required.
- `method`: The HTTP method of the request. Supported values are `GET`, `POST`, `PUT`, `DELETE`, and `PATCH`. Default is `GET`.
- `headers`: The request headers. This is optional.
- `body`: The request body. This is optional.
- `timeoutMs`: The total waiting time for the response in milliseconds. The request will be canceled after timed-out. This is optional.
- `params`: The query parameters. This is optional.
- `responseType`: The response type expected. Supported values are `json`, `text`, and `blob`. Default is `json`.

## Output

The output of the workflow above will be:
```json
{
  "userId": 1,
  "id": 1,
  "title": "delectus aut autem",
  "completed": false
}
```

## Summary

The HTTP Task allows you to send HTTP requests and process responses within your workflow.
Define the request parameters using the `url`, `method`, `headers`, `body`, `timeoutMs`, `params`, and `responseType` parameters.
