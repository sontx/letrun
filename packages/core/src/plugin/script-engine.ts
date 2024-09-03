import { Plugin, ObjectType } from '@letrun/common';

export const SCRIPT_ENGINE_PLUGIN = 'script-engine';

/**
 * Interface representing a script engine plugin which support evaluate script in specific language.
 */
export interface ScriptEngine extends Plugin {
  readonly type: typeof SCRIPT_ENGINE_PLUGIN;

  run(script: string, context: ObjectType): Promise<any>;

  /**
   * Which file extension this script engine support.
   * @param extension ex: js, ts, py
   */
  support(extension: string): boolean;
}
