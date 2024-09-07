import { TaskHandlerInput } from '@letrun/common';
import ms from 'ms';
import { DelayTaskHandler } from '@src/system-task/delay';

const jest = import.meta.jest;

describe('DelayTaskHandler', () => {
  let delayTaskHandler: DelayTaskHandler;
  let mockContext: jest.Mocked<any>;
  let abortController: AbortController;
  let mockSession: jest.Mocked<any>;

  beforeEach(() => {
    delayTaskHandler = new DelayTaskHandler();
    abortController = new AbortController();
    mockSession = {
      signal: abortController.signal,
    };
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        verbose: jest.fn(),
      }),
    };
  });

  it('delays execution for the specified time', async () => {
    const delayMsSpy = jest.spyOn(global, 'setTimeout');
    const taskInput: TaskHandlerInput = {
      task: { parameters: { time: '1s' } },
      context: mockContext,
      session: mockSession,
    } as any;

    await delayTaskHandler.handle(taskInput);
    expect(delayMsSpy).toHaveBeenCalledWith(expect.any(Function), ms('1s'));
    delayMsSpy.mockRestore();
  });

  it('returns the correct data after the delay', async () => {
    const taskInput: TaskHandlerInput = {
      task: { parameters: { time: '1s', data: 'testData' } },
      context: mockContext,
      session: mockSession,
    } as any;

    const result = await delayTaskHandler.handle(taskInput);
    expect(result).toBe('testData');
  });

  it('correctly parses time strings and numbers', async () => {
    const delayMsSpy = jest.spyOn(global, 'setTimeout');
    const taskInputString: TaskHandlerInput = {
      task: { parameters: { time: '2s' } },
      context: mockContext,
      session: mockSession,
    } as any;
    const taskInputNumber: TaskHandlerInput = {
      task: { parameters: { time: 2000 } },
      context: mockContext,
      session: mockSession,
    } as any;

    await delayTaskHandler.handle(taskInputString);
    expect(delayMsSpy).toHaveBeenCalledWith(expect.any(Function), ms('2s'));

    await delayTaskHandler.handle(taskInputNumber);
    expect(delayMsSpy).toHaveBeenCalledWith(expect.any(Function), 2000);

    delayMsSpy.mockRestore();
  });

  it('aborts while delaying', async () => {
    const abortController = new AbortController();
    const taskInput: TaskHandlerInput = {
      task: { parameters: { time: '5s' } },
      context: mockContext,
      session: { signal: abortController.signal },
    } as any;

    // cancel after 1s
    global.setTimeout(() => {
      abortController.abort();
    }, 1000);

    const startTime = Date.now();
    await delayTaskHandler.handle(taskInput);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });
});
