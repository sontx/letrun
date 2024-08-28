import { ContainerDef } from '@src/model';
import { ModuleLocationResolver } from '@src/plugin';
import * as fs from 'node:fs';
import { defaultModuleResolver } from '@src/libs/module-resolver';
import path from 'node:path';

export interface WorkflowDependency {
  name: string;
  handler?: string;
  dependency: string;
  installed: boolean;
  version?: string;
  type?: 'package' | 'script';
}

export class WorkflowDepsScanner {
  constructor(
    private resolver: ModuleLocationResolver,
    private readonly moduleResolver = defaultModuleResolver.resolve,
  ) {}

  async scan(container: ContainerDef): Promise<WorkflowDependency[]> {
    const dependencies: WorkflowDependency[] = [];

    const tasks = Array.isArray(container.tasks)
      ? container.tasks
      : Object.keys(container.tasks ?? {}).map((key) => ({
          ...(container.tasks as any)[key]!,
          name: key,
        }));

    for (const task of tasks) {
      const location = await this.resolver.resolveLocation(task.handler);
      let installed = false;
      let isDirectory = false;

      if (location) {
        const stat = await fs.promises.stat(location);
        if (stat.isDirectory()) {
          isDirectory = true;
          installed = fs.existsSync(path.resolve(location, 'package.json'));
        } else {
          installed = true;
        }
      }

      const version = await this.getVersion(location, isDirectory);

      dependencies.push({
        name: task.name,
        handler: task.handler,
        dependency: location ?? task.handler,
        installed,
        version: version || '0.0.0',
        type: installed ? (isDirectory ? 'package' : 'script') : undefined,
      });

      const deps = await this.scan(task);
      if (deps.length) {
        dependencies.push(...deps);
      }
    }

    return dependencies;
  }

  private async getVersion(location: string, isDirectory: boolean) {
    try {
      const handlerClass = await this.moduleResolver(location);
      const handler = new handlerClass();
      const version = handler.version;

      if (isDirectory && !version) {
        const packageJson = await fs.promises
          .readFile(path.resolve(location, 'package.json'), { encoding: 'utf-8' })
          .then(JSON.parse);
        return packageJson.version;
      }

      return version;
    } catch (e: any) {
      return `Invalid version: ${e.message}`;
    }
  }
}
