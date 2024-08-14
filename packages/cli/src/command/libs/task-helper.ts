import { AppContext, getEntryPointDir, importDefault, TaskHandler } from '@letrun/core';
import path from 'node:path';
import { promises as fs } from 'fs';

type CustomTask = Partial<TaskHandler & { path: string; fullPath: string; group?: string }>;

export class TaskHelper {
  static moduleResolver = importDefault;
  static getEntryPointDir = getEntryPointDir;

  static extractParentDirs(filePath: string) {
    const parts = filePath.split('/');
    parts.pop(); // Remove the file
    return parts.filter(Boolean); // Filter out any empty strings (in case of leading/trailing slashes)
  }

  static searchTasks(tasks: CustomTask[], name: string, group?: string) {
    const searchGroup = group === '.' ? null : group;
    return tasks
      .filter((task) => task.name === name)
      .map((task) => {
        const group = task.group ? task.group : this.extractParentDirs(task.path!).join('/');
        return {
          ...task,
          group: group ? group : undefined,
        };
      })
      .filter((task) => (group ? task.group === searchGroup : true));
  }

  static async loadCustomTasksFromConfig(context: AppContext) {
    const tasksDir = await context.getConfigProvider().get('task.dir', 'tasks');
    const pathTasksDir = path.resolve(this.getEntryPointDir(), tasksDir);
    return await this.loadCustomTasks(pathTasksDir, context);
  }

  private static async loadCustomTasks(tasksDir: string, context: AppContext) {
    const jsFiles = await this.getAllJsFiles(tasksDir, context);
    const tasks: CustomTask[] = [];

    for (const file of jsFiles) {
      const relativePath = path.relative(tasksDir, file).replace(/\\/g, '/');
      const fullPath = path.resolve(tasksDir, file);
      try {
        const handlerClass = await this.moduleResolver(file);
        const handler = handlerClass ? new handlerClass() : null;
        const isValidTask = handler?.name && handler?.handle;
        tasks.push(
          isValidTask
            ? {
                ...handler,
                path: relativePath,
                fullPath,
              }
            : {
                name: `${relativePath} (invalid task)`,
                path: relativePath,
                fullPath,
              },
        );
      } catch (e: any) {
        tasks.push({
          name: `${relativePath} (${e.message})`,
          path: relativePath,
          fullPath,
        });
      }
    }

    return tasks;
  }

  private static async getAllJsFiles(dir: string, context: AppContext) {
    const results: string[] = [];

    const readDir = async (currentDir: string) => {
      const files = await fs.readdir(currentDir);

      for (const file of files) {
        const fullPath = path.resolve(currentDir, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await readDir(fullPath);
        } else if (path.extname(file) === '.js') {
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
}
