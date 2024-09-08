import { HandlerType, ParsedHandler } from '@letrun/common';
import validate from 'validate-npm-package-name';
import { extractJsExtension } from '../utils';

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
        type: this.guessType(input),
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

  private guessType(input: string): HandlerType {
    const isValidNpmPackage = validate(input).validForNewPackages;
    return isValidNpmPackage ? 'package' : extractJsExtension(input) ? 'script' : 'external';
  }
}

export const defaultTaskHandlerParser = new TaskHandlerParser();
