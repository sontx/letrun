import {Plugin} from "../model";

export const ID_GENERATOR_PLUGIN = 'id-generator';

export interface IdGenerator extends Plugin {
  generateId(parentId?: string): string;
  getParentId(id: string): string | undefined;
}
