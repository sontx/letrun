# `meta` Task Command

The `meta` task command is used to extract metadata from a task.

## Usage

```sh
letrun task meta [name] [options]
```

### Arguments

- `[name]`: The name of the task to extract metadata from. If not provided, metadata will be extracted from system tasks.

### Options

- `-p, --pipe`: Pipe the metadata to the standard output.
- `-o, --output <output>`: Write the metadata to a file.

### Examples

#### Extract metadata from a script task

```sh
letrun task meta myscript.js
```

#### Extract metadata from a system task

```sh
letrun task meta log
```

The output will be similar to the following:

```json
{
  "name": "System",
  "description": "Built-in tasks",
  "tasks": [
    {
      "name": "log",
      "description": "Outputs messages or errors for debugging",
      "parameters": {
        "type": "object",
        "keys": {
          "level": {
            "type": "string",
            "flags": {
              "default": "info",
              "only": true
            },
            "allow": [
              "debug",
              "info",
              "warn",
              "error"
            ]
          },
          "message": {
            "type": "string",
            "flags": {
              "presence": "required"
            }
          }
        }
      },
      "output": null
    }
  ]
}
```

#### Extract metadata from a task package

```sh
let run task meta @letrun-task/file
```

> The CLI will install the task package if it is not already installed.

#### Pipe metadata to the standard output

```sh
letrun task meta myscript.js -p > meta.json
```

> The metadata will be written to `meta.json` file.
