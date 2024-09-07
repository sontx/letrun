import { Description, Name, Parameters, validateParameters } from '@letrun/core';
import { TaskHandler, TaskHandlerInput } from '@letrun/common';
import Joi from 'joi';

/**
 * Interface representing the parameters for the HttpTaskHandler.
 */
interface TaskParameters {
  /**
   * The URL endpoint to send the request.
   * @type {string}
   */
  url: string;

  /**
   * The HTTP method of the request.
   * @type {string}
   */
  method: string;

  /**
   * The request headers.
   * @type {Record<string, string>}
   */
  headers?: Record<string, string>;

  /**
   * The request body.
   * @type {any}
   */
  body?: any;

  /**
   * The total waiting time for the response in milliseconds.
   * The request will be canceled after timeout.
   * @type {number}
   */
  timeoutMs?: number;

  /**
   * The query parameters.
   * @type {Record<string, string>}
   */
  params?: Record<string, string>;

  /**
   * The response type expected.
   * @type {'json' | 'text' | 'blob'}
   */
  responseType?: 'json' | 'text' | 'blob';
}

/**
 * Schema for validating the task parameters.
 */
const Schema = Joi.object<TaskParameters>({
  url: Joi.string().description('The URL endpoint to send request').uri().required(),
  method: Joi.string()
    .description('The HTTP method of this request')
    .valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH')
    .default('GET'),
  headers: Joi.object().description("The request's headers").pattern(Joi.string(), Joi.string()),
  body: Joi.any().description('The request body'),
  timeoutMs: Joi.number()
    .description(
      'The total waiting time for the response in milliseconds, the request will be canceled after timed out',
    )
    .integer()
    .min(0),
  params: Joi.object().description('The query parameters').pattern(Joi.string(), Joi.any()),
  responseType: Joi.string()
    .description('The response type you wish receiving')
    .valid('json', 'text', 'blob')
    .default('json'),
});

/**
 * Class representing the handler for the HTTP task.
 * Implements the TaskHandler interface.
 */
@Name('http')
@Description('Sends HTTP requests and processes responses')
@Parameters(Schema)
export class HttpTaskHandler implements TaskHandler {
  /**
   * Handles the task execution.
   * @param {TaskHandlerInput} input - The input for the task handler.
   * @throws {Error} If the HTTP request fails.
   */
  async handle({ task, session }: TaskHandlerInput) {
    const value = validateParameters(task.parameters, Schema);
    const url = new URL(value.url);
    if (value.params) {
      Object.entries(value.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value + '');
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: value.method,
      headers: value.headers,
      body: value.body,
      signal: value.timeoutMs ? AbortSignal.any([AbortSignal.timeout(value.timeoutMs), session.signal]) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}`);
    }

    switch (value.responseType) {
      case 'json':
        return await response.json();
      case 'text':
        return await response.text();
      case 'blob':
        return await response.blob();
      default:
        throw new Error(`Unsupported response type: ${value.responseType}`);
    }
  }
}
