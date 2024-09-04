import { ParsedHandler } from '@letrun/common';

export type TaskHandlerParserFn = (rawHandler: string) => ParsedHandler;

/**
 * Class representing a task handler parser that parses raw handler strings into ParsedHandler objects.
 * @class
 */
export class TaskHandlerParser {
  parse: TaskHandlerParserFn = (input: string): ParsedHandler => {
    const regex =
      /^(package|external|script):((@?[^@:\s]+\/?[^@:\s]+)|([a-zA-Z]:\/[^:@\s]+(?:\/[^:@\s]+)*))?(?:@([^:\s]+))?(?::(\S+))?$/;
    const match = input.match(regex);

    if (!match) {
      return {
        type: 'script',
        name: input,
      };
    }

    const [, type, name, , , version, taskName] = match;

    return {
      type: type! as any,
      name: name!,
      ...(version && { version }),
      ...(taskName && { taskName }),
    };
  };
}

export const defaultTaskHandlerParser = new TaskHandlerParser();
