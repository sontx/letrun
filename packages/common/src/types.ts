/**
 * Represents an object with string keys and values of any type.
 */
export type ObjectType = Record<string, any>;

/**
 * Extracts the keys of an object type `T` whose values are functions.
 *
 * @template T - The object type to extract function keys from.
 */
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
