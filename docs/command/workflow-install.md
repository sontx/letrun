# `install` Workflow Command

The `install` command is used to install a workflow's dependencies from a specified path.
This command is important to ensure that the workflow can be executed correctly without any missing dependencies.
Thus, you should run this command once you have a new workflow file or when you have updated the dependencies in the workflow.

> Currently, the workflow's dependencies are custom tasks packages.

## Usage

```sh
letrun workflow install [path] [options]
```

### Options

- `-d, --dry-run`: Report what it would have done without actually doing it.

### Examples

#### Install a workflow's dependencies

```sh
letrun workflow install /path/to/workflow.json
```

We'll look up all dependencies in the workflow file and install them if missing.

> Technically, you can see all the dependencies in the `dependencies` section of `package.json` file.

#### Dry-run the installation

```sh
letrun workflow install /path/to/workflow.json -d
```

A report of new packages to be installed will be displayed.
