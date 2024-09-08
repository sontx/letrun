import { defaultModuleResolver, ModuleResolverFn } from './module-resolver';
import { TaskGroup, TaskHandler, TaskHandlerConstructor, UNCATEGORIZED_TASK_GROUP } from '@letrun/common';
import { readPackageJson } from '@src/utils';
import path from 'node:path';
import type { PackageJson } from 'type-fest';

export type TaskGroupResolverFn = (taskPath: string) => Promise<TaskGroup>;

/**
 * Resolves a task group from a given path.
 */
export class TaskGroupResolver {
  constructor(private moduleResolver: ModuleResolverFn) {}

  resolve: TaskGroupResolverFn = async (taskPath: string): Promise<TaskGroup> => {
    const module: Record<string, TaskHandlerConstructor> = await this.moduleResolver(taskPath);
    const keys = Object.keys(module);
    const isGroup = !keys.includes('default') || keys.length > 1;

    const packageJson = await this.readPackageJson(taskPath);

    const getUncategorizedTaskGroup = () => {
      const handlerClass = module.default!;
      const handler = new handlerClass();
      if (!this.isValidTaskHandler(handler)) {
        throw new Error(
          `Task handler ${handler.name} in ${taskPath} is not a valid task handler. Please provide a valid task handler.`,
        );
      }
      const name = handler.name || packageJson?.name || path.basename(taskPath, path.extname(taskPath));
      return {
        ...UNCATEGORIZED_TASK_GROUP,
        version: handler.version,
        keywords: handler.keywords,
        type: packageJson ? 'package' : 'script',
        tasks: {
          [name]: handler,
        },
      } as TaskGroup;
    };

    if (!isGroup) {
      return getUncategorizedTaskGroup();
    }

    if (!packageJson) {
      if (module.default) {
        return getUncategorizedTaskGroup();
      }

      throw new Error(
        `No default export found in ${taskPath}, task group is only supported for node modules but standalone scripts tasks are not.`,
      );
    }

    const { name, description, version, author } = packageJson;
    return {
      name: name ?? this.getModuleName(taskPath)!,
      description,
      version,
      author: typeof author === 'string' ? author : author?.name,
      tasks: this.getTaskHandlers(module),
      type: 'package',
    };
  };

  private async readPackageJson(modulePath: string): Promise<PackageJson> {
    return (await readPackageJson(modulePath, false))!;
  }

  private getModuleName(fullPath: string) {
    const effectivePath = path.resolve(fullPath);
    const nodeModulesIndex = effectivePath.indexOf('node_modules');

    if (nodeModulesIndex === -1) {
      return null; // Not a node module path
    }

    const parts = effectivePath.substring(nodeModulesIndex).split(path.sep);

    // Handle scoped packages
    if (parts[1]?.startsWith('@')) {
      return parts.slice(1, 3).join('/');
    }

    return parts[1];
  }

  private getTaskHandlers(module: Record<string, TaskHandlerConstructor>): Record<string, TaskHandler> {
    return Object.entries(module)
      .filter(([_, handlerClass]) => this.isValidTaskHandlerConstructor(handlerClass))
      .reduce(
        (acc, [key, handlerClass]) => {
          const handler = new handlerClass();
          if (!this.isValidTaskHandler(handler)) {
            return acc;
          }
          if (!handler.name) {
            throw new Error(`Task handler ${key} does not have a name. Please provide a name for the task handler.`);
          }
          if (acc[handler.name]) {
            throw new Error(
              `Task handler ${key} has a duplicate name ${handler.name}. Please provide a unique name for the task handler.`,
            );
          }
          return { ...acc, [handler.name]: handler };
        },
        {} as Record<string, TaskHandler>,
      );
  }

  private isValidTaskHandlerConstructor(handlerClass: any): handlerClass is TaskHandlerConstructor {
    return typeof handlerClass === 'function';
  }

  private isValidTaskHandler(handler: TaskHandler): boolean {
    return !!handler.handle;
  }
}

export const defaultTaskGroupResolver = new TaskGroupResolver(defaultModuleResolver.resolve);
