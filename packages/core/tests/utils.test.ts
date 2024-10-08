import {
  childHasStatus,
  countTasks,
  delayMs,
  extractJsExtension,
  extractPackageNameVersion,
  getEntryPointDir,
  getTasksByStatus,
  injectFieldDecorator,
  isRelativePath,
  isTerminatedStatus,
  isWorkflowTaskDefsArray,
  isWorkflowTaskDefsEmpty,
  loadConfigToPlugin,
  readPackageJson,
  scanAllTasks,
  validateParameters,
  wrapPromiseWithAbort,
} from '@src/utils';
import { Container, InterruptInvokeError, InvalidParameterError, Plugin, TaskDef, WorkflowTasks } from '@letrun/common';
import Joi from 'joi';
import fs from 'node:fs';
import { PackageJson } from 'type-fest';

const jest = import.meta.jest;

describe('Utils', () => {
  it('checks if a path is relative', () => {
    expect(isRelativePath('./path')).toBe(true);
    expect(isRelativePath('/absolute/path')).toBe(false);
  });

  it('gets the current directory of the entry point', () => {
    const dir = getEntryPointDir();
    expect(dir).toBeDefined();
  });

  it('loads configuration into a plugin', () => {
    const plugin = { type: 'test', name: 'plugin' } as Plugin;
    const config = { test: { plugin: { key: 'value' } } };
    loadConfigToPlugin(config, plugin);
    expect(plugin.key).toBe('value');
  });

  it('validates parameters against a Joi schema', () => {
    const schema = Joi.object({ key: Joi.string().required() });
    const parameters = { key: 'value' };
    const result = validateParameters(parameters, schema);
    expect(result.key).toBe('value');
  });

  it('throws error for invalid parameters', () => {
    const schema = Joi.object({ key: Joi.string().required() });
    expect(() => validateParameters({}, schema)).toThrow(InvalidParameterError);
  });

  it('checks if any child task has a specific status', () => {
    const parent = { tasks: { task1: { status: 'completed' } } } as unknown as Container;
    expect(childHasStatus(parent, 'completed', false)).toBe(true);
  });

  it('gets all tasks with a specific status', () => {
    const parent = { tasks: { task1: { status: 'completed' } } } as unknown as Container;
    const tasks = getTasksByStatus(parent, 'completed', false);
    expect(tasks.task1).toBeDefined();
  });

  it('scans all tasks and applies a callback function', () => {
    const tasks = { task1: { status: 'completed' } } as unknown as WorkflowTasks;
    let count = 0;
    scanAllTasks(tasks, false, () => {
      count++;
      return true;
    });
    expect(count).toBe(1);
  });

  it('checks if a WorkflowTaskDefs object is an array', () => {
    expect(isWorkflowTaskDefsArray([])).toBe(true);
    expect(isWorkflowTaskDefsArray({})).toBe(false);
  });

  it('checks if a WorkflowTaskDefs object is empty', () => {
    expect(isWorkflowTaskDefsEmpty([])).toBe(true);
    expect(isWorkflowTaskDefsEmpty({})).toBe(true);
    expect(isWorkflowTaskDefsEmpty([{ name: 'task' } as TaskDef])).toBe(false);
  });

  it('counts the number of tasks', () => {
    const tasks = { task1: { status: 'completed' } } as unknown as WorkflowTasks;
    const count = countTasks(tasks, false);
    expect(count).toBe(1);
  });

  it('checks if a task status is a terminated status', () => {
    expect(isTerminatedStatus('completed')).toBe(true);
    expect(isTerminatedStatus('executing')).toBe(false);
  });
});

describe('wrapPromiseWithAbort', () => {
  it('resolves the promise successfully when not aborted', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
    const abortController = new AbortController();
    const wrappedPromise = wrapPromiseWithAbort(promise, abortController.signal);

    await expect(wrappedPromise).resolves.toBe('success');
  });

  it('rejects the promise immediately if the signal is already aborted', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
    const abortController = new AbortController();
    abortController.abort();
    const wrappedPromise = wrapPromiseWithAbort(promise, abortController.signal);

    await expect(wrappedPromise).rejects.toThrow(InterruptInvokeError);
  });

  it('rejects the promise when the abort signal is triggered during execution', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
    const abortController = new AbortController();
    const wrappedPromise = wrapPromiseWithAbort(promise, abortController.signal);

    setTimeout(() => abortController.abort(), 50);

    await expect(wrappedPromise).rejects.toThrow(InterruptInvokeError);
  });
});

describe('delayMs', () => {
  it('delays execution for specified milliseconds', async () => {
    const start = Date.now();
    await delayMs(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(90);
  });

  it('resolves the delay successfully when not aborted', async () => {
    const abortController = new AbortController();
    const start = Date.now();
    await delayMs(100, abortController.signal);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(90);
  });

  it('resolves the delay immediately if the signal is already aborted', async () => {
    const abortController = new AbortController();
    abortController.abort();
    const start = Date.now();
    await delayMs(100, abortController.signal);
    const end = Date.now();
    expect(end - start).toBeLessThan(10);
  });

  it('resolves the delay when the abort signal is triggered during execution', async () => {
    const abortController = new AbortController();
    const start = Date.now();
    setTimeout(() => abortController.abort(), 50);
    await delayMs(100, abortController.signal);
    const end = Date.now();
    expect(end - start).toBeLessThan(100);
  });

  it('extracts package name and version correctly', () => {
    expect(extractPackageNameVersion('@letrun/core@1.0.0')).toEqual({ name: '@letrun/core', version: '1.0.0' });
    expect(extractPackageNameVersion('package@2.3.4')).toEqual({ name: 'package', version: '2.3.4' });
    expect(extractPackageNameVersion('simple-package')).toEqual({ name: 'simple-package', version: undefined });
    expect(extractPackageNameVersion('@scope/package@0.0.1')).toEqual({ name: '@scope/package', version: '0.0.1' });
    expect(extractPackageNameVersion('simple-package@^1.0.0')).toEqual({ name: 'simple-package', version: '^1.0.0' });
    expect(extractPackageNameVersion('some/wrong/module')).toEqual({ name: 'some/wrong/module', version: undefined });
    expect(extractPackageNameVersion('')).toEqual({ name: '', version: undefined });
  });

  it('extracts js extension correctly', () => {
    expect(extractJsExtension('file.js')).toBe('.js');
    expect(extractJsExtension('file.mjs')).toBe('.mjs');
    expect(extractJsExtension('file.cjs')).toBe('.cjs');
    expect(extractJsExtension('file')).toBeNull();
    expect(extractJsExtension('file.txt')).toBeNull();
    expect(extractJsExtension('file.js.txt')).toBeNull();
    expect(extractJsExtension('file.mjs.txt')).toBeNull();
    expect(extractJsExtension('file.cjs.txt')).toBeNull();
  });
});

describe('readPackageJson', () => {
  it('reads and parses package.json file correctly', async () => {
    const modulePath = '/absolute/path/module';
    const packageJsonContent = JSON.stringify({ name: 'test-package', version: '1.0.0' });
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(packageJsonContent);

    const result = await readPackageJson(modulePath);
    expect(result).toEqual({ name: 'test-package', version: '1.0.0' } as PackageJson);
  });

  it('throws an error when package.json file is not found', async () => {
    const modulePath = '/absolute/path/module';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await expect(readPackageJson(modulePath)).rejects.toThrow(`package.json not found in ${modulePath}`);
  });

  it('returns null when package.json file is not found and throwsIfNotFound is false', async () => {
    const modulePath = '/absolute/path/module';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await readPackageJson(modulePath, false);
    expect(result).toBeNull();
  });
});

describe('injectFieldDecorator', () => {
  it('should inject the specified field into the class instance', () => {
    const fieldName = 'injectedField';
    const fieldValue = 'testValue';

    @injectFieldDecorator(fieldName, fieldValue)
    class TestClass {}

    const instance = new TestClass();
    expect((instance as any)[fieldName]).toBe(fieldValue);
  });

  it('should keep the prototype after creating a new class', () => {
    class BaseClass {
      baseMethod() {
        return 'baseMethod';
      }
    }

    const fieldName = 'injectedField';
    const fieldValue = 'testValue';

    @injectFieldDecorator(fieldName, fieldValue)
    class DerivedClass extends BaseClass {}

    const instance = new DerivedClass();
    expect(instance.baseMethod()).toBe('baseMethod');
    expect((instance as any)[fieldName]).toBe(fieldValue);
    expect(instance).toBeInstanceOf(DerivedClass);
  });
});
