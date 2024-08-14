import { Plugin, PluginLoader } from '@letrun/core';
import ConsoleLogger from './console-logger';
import DefaultJavascriptEngine from './default-javascript-engine';
import DefaultTaskInvoker from './default-task-invoker';
import DefaultWorkflowRunner from './default-workflow-runner';
import ExpressionParameterInterpolator from './expression-parameter-interpolator';
import FilePersistence from './file-persistence';
import DefaultInputParameter from './default-input-parameter';
import DefaultIdGenerator from './default-id-generator';

const DEFAULT_PLUGINS: Plugin[] = [
  new ConsoleLogger(),
  new DefaultJavascriptEngine(),
  new DefaultTaskInvoker(),
  new DefaultWorkflowRunner(),
  new ExpressionParameterInterpolator(),
  new FilePersistence(),
  new DefaultInputParameter(),
  new DefaultIdGenerator(),
];

export class DefaultPluginLoader implements PluginLoader {
  async load() {
    return DEFAULT_PLUGINS;
  }
}
