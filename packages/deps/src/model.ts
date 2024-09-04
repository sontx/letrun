import { HandlerType, ParsedHandler } from '@letrun/common';

/**
 * Represents a dependency with its name, version, and optional location.
 */
export interface Dependency {
  name: string;
  version: string;
  location?: string;
}

export interface WorkflowDependency {
  name: string;
  handler?: ParsedHandler;
  dependency?: string;
  installed: boolean;
  version?: string;
  requireVersion?: string;
  incompatibleVersion?: boolean;
  type?: HandlerType | 'system';
}
