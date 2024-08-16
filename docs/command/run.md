# `run` Command

The `run` command is used to execute a workflow defined in a JSON or YAML file.
This command allows you to specify input parameters, save the workflow after execution,
and output the results to a file or pipe them to another command.

## Usage

```sh
letrun run <path> [options]
```

Or just:

```sh
letrun <path> [options]
```

### Arguments

- `<path>`: Path to the workflow file either in JSON or YAML format.

### Options

- `-i, --input <input>`: Input for the workflow, can be a file path or a JSON string.
- `-s, --save`: Whether to save the workflow instance after running it.
- `-o, --output <output>`: Output file which contains the result of the workflow.
- `-p, --pipe`: Pipe the output to the next command.

### Examples

#### Run a workflow with a JSON file

```sh
letrun run path/to/workflow.json
```

#### Run a workflow with input parameters from a file

```sh
letrun run path/to/workflow.json -i path/to/input.json
```

#### Run a workflow and save the result

```sh
letrun run path/to/workflow.json -s
```

> View the saved workflow using the `letrun workflow` command.

#### Run a workflow and output the result to a file

```sh
letrun run path/to/workflow.json -o path/to/output.json
```

#### Run a workflow and pipe the output to another command

```sh
letrun run path/to/workflow.json -p | grep "pattern"
```
