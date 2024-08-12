import { TaskHandler, TaskHandlerInput, validateParameters } from '@letrun/core';
import Joi from 'joi';
import { spawn } from 'child_process';

interface TaskParameters {
  cmd: string;
  args?: string[];
  timeoutMs?: number;
}

const Schema = Joi.object<TaskParameters>({
  cmd: Joi.string().description('The command to execute').required(),
  args: Joi.array().description("The list of command's arguments").items(Joi.string()),
  timeoutMs: Joi.number()
    .description('The maximum execution time in milliseconds, the command process will be terminated after timed out')
    .integer()
    .min(0),
});

export default class Handler implements TaskHandler {
  name = 'exec';
  parameters = Schema.describe();

  async handle({ task, context }: TaskHandlerInput) {
    const value = validateParameters(task.parameters, Schema);

    context.getLogger().debug(`Executing command: ${value.cmd} ${value.args?.join(' ') ?? ''}`);

    const child = spawn(value.cmd, value.args ?? [], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stdoutBuffer: Buffer[] = [];
    const stderrBuffer: Buffer[] = [];

    child.stdout.on('data', (data) => {
      stdoutBuffer.push(data);
    });

    child.stderr.on('data', (data) => {
      stderrBuffer.push(data);
    });

    let timeoutId: NodeJS.Timeout | null = null;
    if (value.timeoutMs) {
      timeoutId = setTimeout(() => {
        context.getLogger().error('Command timed out, killing the process');
        child.kill();
      }, value.timeoutMs);
    }

    const waitForResult = new Promise<any>((resolve, reject) => {
      child.on('close', (code) => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        const stdout = Buffer.concat(stdoutBuffer).toString('utf8');
        const stderr = Buffer.concat(stderrBuffer).toString('utf8');
        if (code !== 0) {
          reject(new Error(`Process failed with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });

    const rawResult = await waitForResult;

    try {
      return JSON.parse(rawResult);
    } catch (e) {
      // we can't parse the result as JSON, return the raw string
      return rawResult;
    }
  }
}
