import { Command } from 'commander';
import { AppContext } from '@letrun/common';

export interface AbstractOptions {
  [key: string]: any;
}

type FieldTransformers = { [key: string]: (value: any) => any };

export abstract class AbstractCommand {
  public abstract load(program: Command): void;

  constructor(protected readonly context: AppContext) {}

  protected parseArrayOption(value: string, unique = true): string[] {
    const array = (value ?? '')
      .split(',')
      .map((field: string) => field.trim())
      .filter((field: string) => field.length > 0);
    return unique ? [...new Set(array)] : array;
  }

  protected extractFields(
    obj: any,
    fields: string[],
    skipUndefined?: boolean,
    fieldTransformers?: FieldTransformers,
  ): any {
    const node: Record<string, any> = {};
    for (const field of fields) {
      const value = obj[field];
      const isUndefined = value === undefined || value === null;
      if (isUndefined && skipUndefined) {
        continue;
      }
      const transformer = fieldTransformers?.[field];
      node[field] = transformer ? transformer(value) : value;
    }
    return node;
  }
}
