# Parameter Interpolator Plugin

The `Parameter Interpolator` plugin allows us to calculate the value of a task's parameter by interpolating it with the context.
This plugin uses the `ParameterInterpolator` interface to define the interpolation logic.

The default implementation of the Parameter Interpolator Plugin uses the `${}` syntax to interpolate the parameter value with the context.
It's also possible to reference nested properties in the context using the dot notation.
If the interpolated value is another interpolatable string, the interpolation will be performed recursively until it reaches a non-interpolatable value.

## Usage

To create a Parameter Interpolator Plugin, you need to implement the `ParameterInterpolator` interface and register your interpolator.

### Example

Here is an example of a Parameter Interpolator Plugin:

```typescript
import { AbstractPlugin, PARAMETER_INTERPOLATOR_PLUGIN, ParameterInterpolator } from '@letrun/core';

export default class LogParameterInterpolator extends AbstractPlugin implements ParameterInterpolator {
  readonly name = 'custom-parameter-interpolator';
  readonly type = PARAMETER_INTERPOLATOR_PLUGIN;

  interpolate<T = any>(value: string, interpolatorContext: any): T {
    // Implement your interpolation logic here
    return value.replace(/\${(.*?)}/g, (_, key) => interpolatorContext[key] || '');
  }
}
```

### Registering the Plugin

To register the Parameter Interpolator Plugin, place it in the `plugins` directory (or the directory specified in your configuration) and ensure it is loaded by the CLI tool.

### Output

If a task has a parameter with the value `${name}`, the interpolator will replace `${name}` with the actual value from the context.

## Summary

The Parameter Interpolator Plugin allows you to extend the CLI tool with custom parameter interpolation logic using the `ParameterInterpolator` interface. Implement the `ParameterInterpolator` interface, register your interpolator, and place the plugin in the appropriate directory to use it.
