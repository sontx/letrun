import {
  AbstractPlugin,
  defaultTaskGroupResolver,
  METADATA_EXTRACTOR,
  MetadataExtractor,
  TASK_HANDLER_LOCATION_RESOLVER_PLUGIN,
  TaskHandlerLocationResolver,
} from '@letrun/core';
import {
  InvalidParameterError,
  ParsedHandler,
  TaskGroup,
  TaskGroupMetadata,
  TaskHandler,
  UNCATEGORIZED_TASK_GROUP,
} from '@letrun/common';

export default class DefaultMetadataExtractor extends AbstractPlugin implements MetadataExtractor {
  readonly name = 'default';
  readonly type = METADATA_EXTRACTOR;

  async extract(input: ParsedHandler | TaskGroup | TaskHandler): Promise<TaskGroupMetadata> {
    let taskGroup: TaskGroup | undefined;
    if (this.isParsedHandler(input)) {
      const location = await this.context!.getPluginManager().callPluginMethod<TaskHandlerLocationResolver, string>(
        TASK_HANDLER_LOCATION_RESOLVER_PLUGIN,
        'resolveLocation',
        input,
        true,
      );

      if (!location) {
        throw new InvalidParameterError(`Cannot find module: ${input.name}`);
      }

      taskGroup = await defaultTaskGroupResolver.resolve(location);
    } else if (this.isTaskHandler(input)) {
      if (!input.name) {
        throw new InvalidParameterError('Task handler name is required');
      }

      taskGroup = {
        ...UNCATEGORIZED_TASK_GROUP,
        version: input.version,
        description: input.description,
        icon: input.icon,
        type: 'script',
        tasks: {
          [input.name]: input,
        },
      };
    } else if (this.isTaskGroup(input)) {
      taskGroup = input;
    }

    if (!taskGroup) {
      throw new InvalidParameterError('Invalid input');
    }

    return this.extractFromTaskGroup(taskGroup);
  }

  private extractFromTaskGroup(taskGroup: TaskGroup): TaskGroupMetadata {
    return {
      name: taskGroup.name,
      version: taskGroup.version,
      description: taskGroup.description,
      author: taskGroup.author,
      type: taskGroup.type,
      icon: taskGroup.icon,
      tasks: Object.entries(taskGroup.tasks ?? {}).map(([name, handler]) => ({
        name: handler.name ?? name,
        version: handler.version,
        description: handler.description,
        icon: handler.icon,
        parameters: handler.parameters,
        output: handler.output,
      })),
    };
  }

  private isParsedHandler(input: ParsedHandler | TaskGroup | TaskHandler): input is ParsedHandler {
    return !this.isTaskHandler(input) && !this.isTaskGroup(input);
  }

  private isTaskHandler(input: ParsedHandler | TaskGroup | TaskHandler): input is TaskHandler {
    return typeof (input as TaskHandler).handle === 'function';
  }

  private isTaskGroup(input: ParsedHandler | TaskGroup | TaskHandler): input is TaskGroup {
    return typeof (input as TaskGroup).tasks === 'object';
  }
}
