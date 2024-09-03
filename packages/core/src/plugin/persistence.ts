import { Plugin } from '@letrun/common';

export const PERSISTENCE_PLUGIN = 'persistence';

/**
 * Interface representing a unit of persistence.
 */
export interface PersistenceUnit {
  /**
   * Saves data with a specified identifier.
   * @param {string} id - The identifier for the data.
   * @param {any} data - The data to save.
   * @returns {Promise<void>} A promise that resolves when the data is saved.
   */
  save(id: string, data: any): Promise<void>;

  /**
   * Loads data by its identifier.
   * @param {string} id - The identifier of the data to load.
   * @returns {Promise<any | undefined>} A promise that resolves with the loaded data or undefined if not found.
   */
  load(id: string): Promise<any | undefined>;

  /**
   * Removes data by its identifier.
   * @param {string} id - The identifier of the data to remove.
   * @returns {Promise<void>} A promise that resolves when the data is removed.
   */
  remove(id: string): Promise<void>;

  /**
   * Lists all identifiers of the stored data.
   * @returns {Promise<string[]>} A promise that resolves with an array of all data identifiers.
   */
  list(): Promise<string[]>;
}

/**
 * Interface representing a Persistence plugin.
 */
export interface Persistence extends Plugin {
  readonly type: typeof PERSISTENCE_PLUGIN;

  /**
   * Retrieves a persistence unit by name.
   * @param {string} name - The name of the persistence unit.
   * @returns {PersistenceUnit} The persistence unit associated with the given name.
   */
  getUnit(name: string): PersistenceUnit;
}
