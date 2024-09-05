import { Plugin, PluginLoader } from '@letrun/common';
import ConsoleLogger from './console-logger';
import DefaultTaskInvoker from './default-task-invoker';
import DefaultWorkflowRunner from './default-workflow-runner';
import ExpressionParameterInterpolator from './expression-parameter-interpolator';
import FilePersistence from './file-persistence';
import DefaultInputParameter from './default-input-parameter';
import DefaultIdGenerator from './default-id-generator';
import WinstonLoggerPlugin from './winston-logger-plugin';
import JavascriptEngine from './javascript-engine';
import PythonEngine from './python-engine';
import DefaultRetryPlugin from './default-retry-plugin';
import DefaultTaskHandlerLocationResolver from './default-task-handler-location-resolver';

const DEFAULT_PLUGINS: Plugin[] = [
  new ConsoleLogger(),
  new DefaultTaskInvoker(),
  new DefaultWorkflowRunner(),
  new ExpressionParameterInterpolator(),
  new FilePersistence(),
  new DefaultInputParameter(),
  new DefaultIdGenerator(),
  new WinstonLoggerPlugin(),
  new JavascriptEngine(),
  new PythonEngine(),
  new DefaultRetryPlugin(),
  new DefaultTaskHandlerLocationResolver(),
];

export class DefaultPluginLoader implements PluginLoader {
  async load() {
    return DEFAULT_PLUGINS;
  }
}
