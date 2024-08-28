import { ContainerDef } from '@src/model';
import { LocationResolverFn } from '@src/plugin';
import fs from 'node:fs';
import { defaultModuleResolver, ModuleResolverFn } from '@src/libs/module-resolver';
import { resolveLocalModuleLocation } from '@src/libs/resolve-local-module-location';
import path from 'node:path';
import { satisfies } from 'compare-versions';
import { extractPackageNameVersion } from '@src/utils';

export interface WorkflowDependency {
  name: string;
  handler?: string;
  dependency: string;
  installed: boolean;
  version?: string;
  requireVersion?: string;
  incompatibleVersion?: boolean;
  type?: 'package' | 'script';
}

export class WorkflowDepsScanner {
  constructor(
    private locationResolver: LocationResolverFn = resolveLocalModuleLocation,
    private moduleResolver: ModuleResolverFn = defaultModuleResolver.resolve,
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
      const location = await this.locationResolver(task.handler);
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

      const version = location && installed ? await this.getVersion(location, isDirectory) : null;
      let handler = task.handler;
      let requireVersion: string | undefined;
      if (isDirectory) {
        const { name, version: packageVersion } = extractPackageNameVersion(handler);
        handler = name;
        requireVersion = packageVersion;
      }

      dependencies.push({
        name: task.name,
        handler: handler,
        dependency: location ?? task.handler,
        installed,
        version: version || '0.0.0',
        incompatibleVersion: version && requireVersion ? !satisfies(version, requireVersion) : false,
        requireVersion,
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
