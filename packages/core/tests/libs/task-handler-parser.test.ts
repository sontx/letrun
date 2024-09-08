import { ParsedHandler } from '@letrun/common';
import { TaskHandlerParser } from '@src/libs';

const jest = import.meta.jest;

describe('TaskHandlerParser', () => {
  const parser = new TaskHandlerParser();

  it('parses a handler with type package and name only', () => {
    const rawHandler = 'package:handler-name';
    const expected: ParsedHandler = { type: 'package', name: 'handler-name' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type external and name only', () => {
    const rawHandler = 'external:handler-name';
    const expected: ParsedHandler = { type: 'external', name: 'handler-name' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type script and name only', () => {
    const rawHandler = 'script:handler-name';
    const expected: ParsedHandler = { type: 'script', name: 'handler-name' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, name, and version', () => {
    const rawHandler = 'package:handler-name@1.0.0';
    const expected: ParsedHandler = { type: 'package', name: 'handler-name', version: '1.0.0' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, name, version, and task name', () => {
    const rawHandler = 'package:handler-name@1.0.0:task-name';
    const expected: ParsedHandler = { type: 'package', name: 'handler-name', version: '1.0.0', taskName: 'task-name' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package and scoped package name only', () => {
    const rawHandler = 'package:@scope/handler-name';
    const expected: ParsedHandler = { type: 'package', name: '@scope/handler-name' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, scoped package name, and version', () => {
    const rawHandler = 'package:@scope/handler-name@1.0.0';
    const expected: ParsedHandler = { type: 'package', name: '@scope/handler-name', version: '1.0.0' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, scoped package name, version, and task name', () => {
    const rawHandler = 'package:@scope/handler-name@1.0.0:task-name';
    const expected: ParsedHandler = {
      type: 'package',
      name: '@scope/handler-name',
      version: '1.0.0',
      taskName: 'task-name',
    };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, name, and range version', () => {
    const rawHandler = 'package:handler-name@^1.0.0';
    const expected: ParsedHandler = { type: 'package', name: 'handler-name', version: '^1.0.0' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, scoped package name, and range version', () => {
    const rawHandler = 'package:@scope/handler-name@^1.0.0';
    const expected: ParsedHandler = { type: 'package', name: '@scope/handler-name', version: '^1.0.0' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, scoped package name, range version, and task name', () => {
    const rawHandler = 'package:@scope/handler-name@^1.0.0:task-name';
    const expected: ParsedHandler = {
      type: 'package',
      name: '@scope/handler-name',
      version: '^1.0.0',
      taskName: 'task-name',
    };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package and absolute path name', () => {
    const rawHandler = 'package:C:/path/to/handler';
    const expected: ParsedHandler = { type: 'package', name: 'C:/path/to/handler' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package and relative path name', () => {
    const rawHandler = 'package:./path/to/handler';
    const expected: ParsedHandler = { type: 'package', name: './path/to/handler' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, absolute path name, and version', () => {
    const rawHandler = 'package:C:/path/to/handler@1.0.0';
    const expected: ParsedHandler = { type: 'package', name: 'C:/path/to/handler', version: '1.0.0' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, relative path name, and version', () => {
    const rawHandler = 'package:./path/to/handler@1.0.0';
    const expected: ParsedHandler = { type: 'package', name: './path/to/handler', version: '1.0.0' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, absolute path name, version, and task name', () => {
    const rawHandler = 'package:C:/path/to/handler@1.0.0:task-name';
    const expected: ParsedHandler = {
      type: 'package',
      name: 'C:/path/to/handler',
      version: '1.0.0',
      taskName: 'task-name',
    };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, relative path name, version, and task name', () => {
    const rawHandler = 'package:./path/to/handler@1.0.0:task-name';
    const expected: ParsedHandler = {
      type: 'package',
      name: './path/to/handler',
      version: '1.0.0',
      taskName: 'task-name',
    };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package and absolute Unix path name', () => {
    const rawHandler = 'package:/path/to/handler';
    const expected: ParsedHandler = { type: 'package', name: '/path/to/handler' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, absolute Unix path name, and version', () => {
    const rawHandler = 'package:/path/to/handler@1.0.0';
    const expected: ParsedHandler = { type: 'package', name: '/path/to/handler', version: '1.0.0' };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('parses a handler with type package, absolute Unix path name, version, and task name', () => {
    const rawHandler = 'package:/path/to/handler@1.0.0:task-name';
    const expected: ParsedHandler = {
      type: 'package',
      name: '/path/to/handler',
      version: '1.0.0',
      taskName: 'task-name',
    };

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
  });

  it('guesses type when input does not match pattern', () => {
    const rawHandler = 'invalid-handler';
    const expected: ParsedHandler = { type: 'external', name: 'invalid-handler' };

    jest.spyOn(parser as any, 'guessType').mockReturnValue('external');

    const result = parser.parse(rawHandler);

    expect(result).toEqual(expected);
    expect((parser as any).guessType).toHaveBeenCalledWith(rawHandler);
  });
});
