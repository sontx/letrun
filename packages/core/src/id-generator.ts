/**
 * Class responsible for generating unique IDs.
 */
export class IdGenerator {
  /** Separator used in IDs. */
  static readonly idSeparator = '/';

  /** Counter for generating unique IDs. */
  private freeId = 0;

  /**
   * Creates an instance of IdGenerator.
   * @param {string} [idSeparator=IdGenerator.idSeparator] - Separator used in IDs.
   */
  constructor(private idSeparator: string = IdGenerator.idSeparator) {}

  /**
   * Generates a unique ID.
   * @param {string} [parentId] - Optional parent ID to prefix the generated ID.
   * @returns {string} The generated unique ID.
   */
  generateId(parentId?: string): string {
    return parentId ? `${parentId}${this.idSeparator}${this.freeId++}` : `${this.freeId++}`;
  }

  /**
   * Extracts the parent ID from a given ID.
   * @param {string} id - The ID to extract the parent ID from.
   * @param {string} [idSeparator=IdGenerator.idSeparator] - Separator used in IDs.
   * @returns {string | undefined} The extracted parent ID, or undefined if no parent ID exists.
   */
  static getParentId(id: string, idSeparator: string = IdGenerator.idSeparator): string | undefined {
    return id?.substring(0, id.lastIndexOf(idSeparator));
  }
}
