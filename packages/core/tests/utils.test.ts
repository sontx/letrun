import {
  childHasStatus,
  countTasks,
  delayMs,
  getEntryPointDir,
  getTasksByStatus,
  importDefault,
  isRelativePath,
  isTerminatedStatus,
  isWorkflowTaskDefsArray,
  isWorkflowTaskDefsEmpty,
  loadConfigToPlugin,
  scanAllTasks,
  validateParameters,
} from '@src/utils';
import { Container, Plugin, TaskDef, WorkflowTasks } from '@src/model';
import { InvalidParameterError } from '@src/error';
import Joi from 'joi';

describe('Utils', () => {
  it('throws error for imports default export from a not found module', async () => {
    await expect(importDefault('./not-found-module.js')).rejects.toThrow(/^Cannot find module*/);
  });

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

import { wrapPromiseWithAbort } from '@src/utils';
import { InterruptInvokeError } from '@src/error';

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
    expect(end - start).toBeGreaterThanOrEqual(100);
  });

  it('resolves the delay successfully when not aborted', async () => {
    const abortController = new AbortController();
    const start = Date.now();
    await delayMs(100, abortController.signal);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(100);
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
});
