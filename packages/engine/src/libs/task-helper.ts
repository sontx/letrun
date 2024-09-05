import { defaultTaskGroupResolver, extractJsExtension, getEntryPointDir } from '@letrun/core';
import path from 'node:path';
import * as fs from 'fs';
import { NpmPackage } from '@letrun/deps';
import { AppContext, TaskHandler, UNCATEGORIZED_TASK_GROUP } from '@letrun/common';

type CustomTask = Partial<
  TaskHandler & {
    path: string;
    fullPath: string;
    group?: string;
    groupDescription?: string;
    isPackage?: boolean;
    handler?: string;
    version?: string;
  }
>;

export class TaskHelper {
  static taskGroupResolver = defaultTaskGroupResolver.resolve;
  static getEntryPointDir = getEntryPointDir;

  static extractParentDirs(filePath: string) {
    const parts = filePath.split('/');
    parts.pop(); // Remove the file
    return parts.filter(Boolean); // Filter out any empty strings (in case of leading/trailing slashes)
  }

  static searchTasks(tasks: CustomTask[], name: string, group?: string) {
    const searchGroup = group === '.' ? null : group;
    return tasks
      .filter(
        (task) =>
          task.name === name ||
          task.path === name ||
          task.handler === name ||
          (task.group && `${task.group}/${task.name}` === name),
      )
      .filter((task) => (group ? task.group === searchGroup : true));
  }

  static async loadCustomTasksFromConfig(context: AppContext) {
    const tasksDir = await context.getConfigProvider().get('task.dir', 'tasks');
    const pathTasksDir = path.resolve(this.getEntryPointDir(), tasksDir);
    return await this.loadCustomTasks(pathTasksDir, context);
  }

  private static async loadCustomTasks(tasksDir: string, context: AppContext) {
    const resultTasks: CustomTask[] = [];

    const taskFilesFromDir = await this.getTaskFilesFromDir(tasksDir, context);
    for (const file of taskFilesFromDir) {
      const tasks = await this.createBundledTask(file, tasksDir);
      resultTasks.push(...tasks);
    }

    const depsTaskFiles = await this.getDepsTaskFiles();
    const workingDir = path.join(getEntryPointDir(), 'node_modules');
    for (const file of depsTaskFiles) {
      const tasks = await this.createBundledTask(file, workingDir);
      resultTasks.push(...tasks);
    }

    return resultTasks;
  }

  private static async createBundledTask(file: string, rootDir: string) {
    const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
    const fullPath = path.resolve(rootDir, file);

    try {
      const taskGroup = await this.taskGroupResolver(file);
      const isNodeModule = file.includes('node_modules');
      const rootHandler =
        taskGroup.type === 'package' ? `${isNodeModule ? 'package' : 'external'}:${taskGroup.name}` : relativePath;

      return Object.entries(taskGroup.tasks ?? {}).map(([name, handler]) => {
        const isUncategorizedGroup = taskGroup.name === UNCATEGORIZED_TASK_GROUP.name;
        const declarativeHandler =
          taskGroup.type === 'package' ? `${rootHandler}${isUncategorizedGroup ? '' : `:${name}`}` : rootHandler;
        const parentDirs = this.extractParentDirs(relativePath);
        const group = taskGroup.type === 'script' && parentDirs.length ? parentDirs[0] : taskGroup.name;

        return {
          ...handler,
          name,
          version: handler.version || taskGroup.version,
          groupDescription: taskGroup.description,
          group,
          path: relativePath,
          fullPath,
          isPackage: taskGroup.type === 'package',
          handler: declarativeHandler,
        };
      });
    } catch (e: any) {
      return [
        {
          name: `${relativePath} (${e.message})`,
          path: relativePath,
          fullPath,
        },
      ];
    }
  }

  private static async getTaskFilesFromDir(dir: string, context: AppContext) {
    const results: string[] = [];

    const readDir = async (currentDir: string) => {
      const files = await fs.promises.readdir(currentDir);

      for (const file of files) {
        const fullPath = path.resolve(currentDir, file);
        const stat = await fs.promises.stat(fullPath);

        if (stat.isDirectory()) {
          const packageJsonPath = path.join(fullPath, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            results.push(fullPath);
          } else {
            await readDir(fullPath);
          }
        } else if (this.isJsFile(file)) {
          results.push(fullPath);
        }
      }
    };

    try {
      await readDir(dir);
    } catch (e: any) {
      context.getLogger().error(`Error reading directory: ${e.message}`);
      return [];
    }
    return results;
  }

  private static async getDepsTaskFiles() {
    const npmPackage = new NpmPackage();
    const deps = await npmPackage.list();
    return deps.filter((dep) => dep.location).map((dep) => path.resolve(dep.location!));
  }

  private static isJsFile(file: string) {
    return !!extractJsExtension(file);
  }
}
