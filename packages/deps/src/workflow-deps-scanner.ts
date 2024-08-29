import fs from 'node:fs';
import path from 'node:path';
import type { PackageJson } from 'type-fest';
import { compare, satisfies } from 'compare-versions';
import {
  ContainerDef,
  defaultModuleResolver,
  extractPackageNameVersion,
  LocationResolverFn,
  ModuleResolverFn,
  resolveLocalModuleLocation,
} from '@letrun/core';
import { WorkflowDependency } from '@src/model';
import validate from 'validate-npm-package-name';

export class WorkflowDepsScanner {
  constructor(
    private locationResolver: LocationResolverFn = resolveLocalModuleLocation,
    private moduleResolver: ModuleResolverFn = defaultModuleResolver.resolve,
  ) {}

  async scan(container: ContainerDef): Promise<WorkflowDependency[]> {
    let dependencies: WorkflowDependency[] = [];

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
      const { name, version: packageVersion } = extractPackageNameVersion(handler);
      if (isDirectory) {
        handler = name;
        requireVersion = packageVersion;
      }

      dependencies.push({
        name: task.name,
        handler: handler,
        dependency: location ?? task.handler,
        installed,
        version: version ?? undefined,
        incompatibleVersion: version && requireVersion ? !satisfies(version, requireVersion) : false,
        requireVersion,
        type: installed ? (isDirectory ? 'package' : 'script') : undefined,
      });

      const deps = await this.scan(task);
      if (deps.length) {
        dependencies.push(...deps);
      }
    }

    dependencies = this.removeDuplicatedPackages(dependencies);
    const candidatePackages = dependencies.filter(
      (dep) => !dep.installed && !dep.requireVersion && !validate(dep.handler!).errors?.length,
    );

    if (candidatePackages.length) {
      await Promise.all(
        candidatePackages.map(async (dep) => {
          const foundVersion = await this.tryGetNpmPackageVersion(dep.handler!);
          if (foundVersion) {
            dep.requireVersion = foundVersion;
            dep.type = 'package';
          }
        }),
      );
    }

    return dependencies;
  }

  private removeDuplicatedPackages(dependencies: WorkflowDependency[]) {
    const map = new Map<string, WorkflowDependency>();

    for (const dep of dependencies) {
      const packageName = dep.handler!;
      if (!map.has(packageName)) {
        map.set(packageName, dep);
      } else {
        const existing = map.get(packageName)!;
        if (dep.requireVersion && existing.requireVersion) {
          if (compare(existing.requireVersion, dep.requireVersion, '<')) {
            map.set(dep.name, dep);
          }
        } else if (dep.requireVersion) {
          map.set(packageName, dep);
        }
      }
    }

    return Array.from(map.values());
  }

  private async tryGetNpmPackageVersion(packageName: string) {
    try {
      const { name, version } = extractPackageNameVersion(packageName);
      const response = await fetch(`https://registry.npmjs.org/${name}`);
      const data = (await response.json()) as any;
      return data['name'] === name ? (version ? version : `^${data['dist-tags'].latest}`) : null;
    } catch {
      return null;
    }
  }

  private async getVersion(location: string, isDirectory: boolean) {
    let taskVersion;
    let errorMessage;
    try {
      const handlerClass = await this.moduleResolver(location);
      const handler = new handlerClass();
      taskVersion = handler.version;
    } catch (e: any) {
      errorMessage = e.message;
    }

    try {
      if (isDirectory && !taskVersion) {
        const packageJson: PackageJson = await fs.promises
          .readFile(path.resolve(location, 'package.json'), { encoding: 'utf-8' })
          .then(JSON.parse);
        return packageJson.version;
      }

      return taskVersion || errorMessage;
    } catch (e: any) {
      return e.message;
    }
  }
}
