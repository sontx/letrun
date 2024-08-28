import { AppContext, defaultModuleResolver, getEntryPointDir, TaskHandler } from '@letrun/core';
import path from 'node:path';
import * as fs from 'fs';

type CustomTask = Partial<
  TaskHandler & { path: string; fullPath: string; group?: string; isPackage?: boolean; handler?: string }
>;

export class TaskHelper {
  static moduleResolver = defaultModuleResolver.resolve;
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
    const taskFiles = await this.getTaskFiles(tasksDir, context);
    const tasks: CustomTask[] = [];

    for (const file of taskFiles) {
      const task = await this.createBundledTask(file, tasksDir);
      tasks.push(task);
    }

    return tasks;
  }

  private static async createBundledTask(file: string, tasksDir: string) {
    const relativePath = path.relative(tasksDir, file).replace(/\\/g, '/');
    const fullPath = path.resolve(tasksDir, file);

    try {
      const handlerClass = await this.moduleResolver(file);
      const handler = handlerClass ? new handlerClass() : null;
      const isValidTask = !!handler?.handle;
      const isPackage = !this.isJsFile(file);
      const declarativeHandler = isPackage ? relativePath : relativePath.replace(/\.[^/.]+$/, '');
      const group = this.extractParentDirs(relativePath).join('/');

      const getTaskName = async () => {
        if (handler?.name) {
          return handler.name;
        }

        if (isPackage) {
          const packageJsonPath = path.join(fullPath, 'package.json');
          const packageJson = await fs.promises.readFile(packageJsonPath, 'utf8').then(JSON.parse);
          return packageJson.name;
        }

        // file name without extension
        return path.basename(file, path.extname(file));
      };
      const name = await getTaskName();

      return isValidTask
        ? {
            ...handler,
            name,
            group,
            path: relativePath,
            fullPath,
            isPackage,
            handler: declarativeHandler,
          }
        : {
            name: `${relativePath} (invalid task)`,
            path: relativePath,
            fullPath,
            group,
          };
    } catch (e: any) {
      return {
        name: `${relativePath} (${e.message})`,
        path: relativePath,
        fullPath,
      };
    }
  }

  private static async getTaskFiles(dir: string, context: AppContext) {
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

  private static isJsFile(file: string) {
    return ['.js', '.cjs'].includes(path.extname(file));
  }
}
