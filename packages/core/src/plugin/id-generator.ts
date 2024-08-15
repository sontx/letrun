import { Plugin } from '@src/model';

export const ID_GENERATOR_PLUGIN = 'id-generator';

/**
 * Interface representing an ID Generator plugin.
 * Extends the Plugin interface.
 */
export interface IdGenerator extends Plugin {
  /**
   * Generates a unique ID.
   * @param parentId - Optional parent ID to prefix the generated ID.
   * @returns A unique ID string.
   */
  generateId(parentId?: string): string;

  /**
   * Retrieves the parent ID from a given ID.
   * @param id - The ID string to extract the parent ID from.
   * @returns The parent ID if present, otherwise undefined or empty.
   */
  getParentId(id: string): string | undefined;
}
