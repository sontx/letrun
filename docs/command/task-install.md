# `install` Task Command

The `install` command is used to install a task package from the npm registry.

## Usage

```sh
letrun task install [name]
```

### Arguments

- `[name]`: The name of the task package to install. If not provided, it will install all packages which defined in the `package.json` file.

### Examples

#### Install a task package

```sh
letrun task install letrun-task-greeting
```

The `letrun-task-greeting` package will be installed from the npm registry and placed in the `node_modules` directory as a normal npm package.

#### Install all task packages

```sh
letrun task install
```

All task packages defined in the `package.json` file will be installed from the npm registry and placed in the `node_modules` directory as normal npm packages.
