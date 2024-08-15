import { Plugin } from '@src/model';

export const PARAMETER_INTERPOLATOR_PLUGIN = 'parameter-interpolator';

/**
 * Interface representing a Parameter Interpolator plugin.
 */
export interface ParameterInterpolator extends Plugin {
  /**
   * Interpolates a given value within a specified context.
   * @param {string} value - The value to interpolate.
   * @param {any} interpolatorContext - The context in which to perform the interpolation.
   * @returns {T | Promise<T>} The interpolated value, which can be of any type or a promise resolving to any type.
   */
  interpolate<T = any>(value: string, interpolatorContext: any): T | Promise<T>;
}
