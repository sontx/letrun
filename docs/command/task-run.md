# `run` Task Command

The `run` command is used to execute a task directly without defining a workflow.
This command allows you to specify the name of the task and optionally the group to which the task belongs,
as well as input parameters and output options.

## Usage

```sh
letrun task run <name> [options]
```

### Arguments

- `<name>`: The name of the task to run.

### Options

- `-i, --input <input>`: Input for the task, can be a file path or a JSON string.
- `-g, --group <group>`: The group of the task. Use `.` if you want to search tasks that don't have a group.
- `-o, --output <output>`: Output file which contains the result of the task.
- `-p, --pipe`: Pipe the output to the next command.

### Examples

#### Run a task by name

```sh
letrun task run task-name
```

#### Run a task and save the output to a file

```sh
letrun task run task-name -o path/to/output.json
```
