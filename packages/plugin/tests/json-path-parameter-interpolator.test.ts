import JsonPathParameterInterpolator from '@src/json-path-parameter-interpolator';
import { AppContext } from '@letrun/common';
import { Subject } from "rxjs";

const jest = import.meta.jest;

describe('JsonPathParameterInterpolator', () => {
  it('returns the original value if it is not a JSON path', () => {
    const interpolator = new JsonPathParameterInterpolator();
    const result = interpolator.interpolate('plainValue', {});
    expect(result).toBe('plainValue');
  });

  it('interpolates a simple JSON path', () => {
    const interpolator = new JsonPathParameterInterpolator();
    const context = { key: 'value' };
    const result = interpolator.interpolate('$.key', context);
    expect(result).toBe('value');
  });

  it('interpolates nested JSON paths recursively', () => {
    const interpolator = new JsonPathParameterInterpolator();
    const context = { key: '$.nestedKey', nestedKey: 'finalValue' };
    const result = interpolator.interpolate('$.key', context);
    expect(result).toBe('finalValue');
  });

  it('returns the original value if the JSON path is invalid', () => {
    const interpolator = new JsonPathParameterInterpolator();
    const result = interpolator.interpolate('$.invalid[', {});
    expect(result).toBe('$.invalid[');
  });

  it('returns the original value if the JSON path key is not found', () => {
    const interpolator = new JsonPathParameterInterpolator();
    const context = {};
    const result = interpolator.interpolate('$.missingKey', context);
    expect(result).toBe('$.missingKey');
  });

  it('loads configuration correctly', async () => {
    const context = {
      getConfigProvider: jest.fn().mockReturnValue({
        getAll: jest.fn().mockReturnValue({
          'parameter-interpolator': {
            'json-path': { flatten: true, recursive: false },
          },
        }),
        get changes$() {
          return new Subject<any>();
        },
      }),
      getLogger: jest.fn().mockReturnValue({ verbose: jest.fn(), debug: jest.fn() }),
    } as unknown as AppContext;
    const interpolator = new JsonPathParameterInterpolator();
    await interpolator.load(context);
    expect(interpolator['flatten']).toBe(true);
    expect(interpolator['recursive']).toBe(false);
  });

  it('unloads without errors', async () => {
    const interpolator = new JsonPathParameterInterpolator();
    await expect(interpolator.unload()).resolves.toBeUndefined();
  });
});
