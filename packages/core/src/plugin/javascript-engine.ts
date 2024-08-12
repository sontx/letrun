import { ObjectType } from '../types';
import { Plugin } from '../model';

export const JAVASCRIPT_PLUGIN = 'javascript';

/**
 * Interface representing a JavaScript engine plugin.
 */
export interface JavaScriptEngine extends Plugin {
  /**
   * Runs a JavaScript script within a given context.
   * @param {string} script - The JavaScript code to execute.
   * @param {ObjectType} context - The context in which to run the script.
   * @returns {Promise<any>} A promise that resolves with the result of the script execution.
   */
  run(script: string, context: ObjectType): Promise<any>;
}
