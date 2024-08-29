/**
 * Represents a dependency with its name, version, and optional location.
 */
export interface Dependency {
  name: string;
  version: string;
  location?: string;
}
