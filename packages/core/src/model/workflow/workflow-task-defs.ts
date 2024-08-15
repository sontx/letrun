import { TaskDef } from './task-def';

/** Type representing a collection of task definitions.
 * Tasks are either in array style (run sequence) or map style (run parallel).
 * */
export type WorkflowTaskDefs = Record<string, TaskDef> | TaskDef[];
