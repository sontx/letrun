import ExpressionParameterInterpolator from '@src/expression-parameter-interpolator';
import { AppContext } from '@letrun/core';
import { Subject } from "rxjs";

const jest = import.meta.jest;

describe('ExpressionParameterInterpolator', () => {
  it('returns the original value if it is not an expression', () => {
    const interpolator = new ExpressionParameterInterpolator();
    const result = interpolator.interpolate('plainValue', {});
    expect(result).toBe('plainValue');
  });

  it('interpolates a simple expression', () => {
    const interpolator = new ExpressionParameterInterpolator();
    const context = { workflow: { input: { key: 'value' } } };
    const result = interpolator.interpolate('${input.key}', context);
    expect(result).toBe('value');
  });

  it('interpolates nested expressions recursively', () => {
    const interpolator = new ExpressionParameterInterpolator();
    const context = { workflow: { input: { key: '${variables.value}' }, variables: { value: 'finalValue' } } };
    const result = interpolator.interpolate('${input.key}', context);
    expect(result).toBe('finalValue');
  });

  it('returns the original value if the expression is invalid', () => {
    const interpolator = new ExpressionParameterInterpolator();
    const result = interpolator.interpolate('${invalid.expression', {});
    expect(result).toBe('${invalid.expression');
  });

  it('returns the original value if the expression key is not found', () => {
    const interpolator = new ExpressionParameterInterpolator();
    const context = { workflow: { input: {} } };
    const result = interpolator.interpolate('${input.missingKey}', context);
    expect(result).toBe('${input.missingKey}');
  });

  it('interpolates expressions inside a string (placeholder)', () => {
    const interpolator = new ExpressionParameterInterpolator();
    const context = { workflow: { input: { name: 'World' } } };
    const result = interpolator.interpolate('Hello ${input.name}', context);
    expect(result).toBe('Hello World');
  });

  it('interpolates multiple placeholders in a string', () => {
    const interpolator = new ExpressionParameterInterpolator();
    const context = { workflow: { input: { firstName: 'John', lastName: 'Doe' } } };
    const result = interpolator.interpolate('Hello ${input.firstName} ${input.lastName}', context);
    expect(result).toBe('Hello John Doe');
  });

  it('loads configuration correctly', async () => {
    const context = {
      getConfigProvider: jest.fn().mockReturnValue({
        getAll: jest.fn().mockReturnValue({ 'parameter-interpolator': { expression: { recursive: false } } }),
        get changes$() {
          return new Subject<any>();
        },
      }),
      getLogger: jest.fn().mockReturnValue({ verbose: jest.fn(), debug: jest.fn() }),
    } as unknown as AppContext;
    const interpolator = new ExpressionParameterInterpolator();
    await interpolator.load(context);
    expect(interpolator['recursive']).toBe(false);
  });

  it('unloads without errors', async () => {
    const interpolator = new ExpressionParameterInterpolator();
    await expect(interpolator.unload()).resolves.toBeUndefined();
  });
});
