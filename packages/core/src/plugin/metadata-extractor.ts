import { ParsedHandler, Plugin, TaskGroup, TaskGroupMetadata, TaskHandler } from '@letrun/common';

export const METADATA_EXTRACTOR = 'metadata-extractor';

/**
 * Extracts task group metadata from either a task handler or a task group or a parsed handler.
 */
export interface MetadataExtractor extends Plugin {
  readonly type: typeof METADATA_EXTRACTOR;

  extract(parsedHandler: ParsedHandler): Promise<TaskGroupMetadata>;
  extract(taskGroup: TaskGroup): Promise<TaskGroupMetadata>;
  extract(task: TaskHandler): Promise<TaskGroupMetadata>;
}
