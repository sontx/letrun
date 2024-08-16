# Command Plugin

The Command Plugin allows you to extend the CLI tool with custom commands.
You can add more Command Plugins to provide additional functionality to the CLI tool.
This plugin uses the `commander` package to define commands.

## Usage

To create a Command Plugin, you need to implement the `CommandPlugin` interface and register your commands.

### Example

Here is an example of a Command Plugin:

```typescript
import { AbstractPlugin, COMMAND_PLUGIN, CommandPlugin } from '@letrun/core';
import { Command } from 'commander';
import art from './art';

export default class SampleCommandPlugin extends AbstractPlugin implements CommandPlugin {
  readonly name = 'sample';
  readonly type = COMMAND_PLUGIN;

  register(program: Command): void {
    program
      .command('hug')
      .description('hug Jerry 3000 times')
      .action(() => {
        console.log(art);
      });
  }
}
```

### Registering the Plugin

To register the Command Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

The registered commands will be available in the CLI tool. For example, running the `hug` command will display a hug message.

## Summary

The Command Plugin allows you to extend the CLI tool with custom commands using the `commander` package.
Implement the `CommandPlugin` interface, register your commands, and place the plugin in the appropriate directory to use it.
