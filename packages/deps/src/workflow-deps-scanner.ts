import fs from 'node:fs';
import path from 'node:path';
import type { PackageJson } from 'type-fest';
import { compare, satisfies } from 'compare-versions';
import {
  defaultTaskGroupResolver,
  defaultTaskHandlerParser,
  LocationResolverFn,
  resolveTaskHandlerLocation,
  TaskGroupResolverFn,
  TaskHandlerParserFn,
} from '@letrun/core';
import { WorkflowDependency } from '@src/model';
import validate from 'validate-npm-package-name';
import { ContainerDef, ParsedHandler, TaskDef } from '@letrun/common';

export class WorkflowDepsScanner {
  constructor(
    public taskHandlerParse: TaskHandlerParserFn = defaultTaskHandlerParser.parse,
    public locationResolver: LocationResolverFn = resolveTaskHandlerLocation,
    public taskGroupResolver: TaskGroupResolverFn = defaultTaskGroupResolver.resolve,
    public checkSystemDependencyFn: (handler: string) => boolean = () => false,
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
      const dependency: WorkflowDependency = this.checkSystemDependencyFn(task.handler)
        ? {
            name: task.name,
            handler: this.taskHandlerParse(task.handler),
            installed: true,
            incompatibleVersion: false,
            type: 'system',
          }
        : await this.createDependency(task);
      dependencies.push(dependency);
      const deps = await this.scan(task);
      if (deps.length) {
        dependencies.push(...deps);
      }
    }

    dependencies = this.removeDuplicatedPackages(dependencies);
    const candidatePackages = dependencies.filter(
      (dep) => dep.type === 'package' && !dep.installed && !validate(dep.handler?.name!).errors?.length,
    );

    if (candidatePackages.length) {
      await Promise.all(
        candidatePackages.map(async (dep) => {
          const foundVersion = await this.tryGetNpmPackageVersion(dep.handler!);
          if (foundVersion) {
            dep.requireVersion = foundVersion;
          }
        }),
      );
    }

    return dependencies;
  }

  private async createDependency(task: TaskDef): Promise<WorkflowDependency> {
    const parsedHandler = this.taskHandlerParse(task.handler);
    const location = await this.locationResolver(parsedHandler);
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

    return {
      name: task.name,
      handler: parsedHandler,
      dependency: location ?? task.handler,
      installed,
      version: version ?? undefined,
      incompatibleVersion: version && parsedHandler.version ? !satisfies(version, parsedHandler.version) : false,
      requireVersion: parsedHandler.version,
      type: parsedHandler.type,
    };
  }

  private removeDuplicatedPackages(dependencies: WorkflowDependency[]) {
    const map = new Map<string, WorkflowDependency>();

    for (const dep of dependencies) {
      const identify = `${dep.handler?.name}@${dep.handler?.taskName}`;
      if (!map.has(identify)) {
        map.set(identify, dep);
      } else {
        const existing = map.get(identify)!;
        if (dep.requireVersion && existing.requireVersion) {
          if (compare(existing.requireVersion, dep.requireVersion, '<')) {
            map.set(dep.name, dep);
          }
        } else if (dep.requireVersion) {
          map.set(identify, dep);
        }
      }
    }

    return Array.from(map.values());
  }

  private async tryGetNpmPackageVersion({ name, version }: ParsedHandler) {
    try {
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
      const taskGroup = await this.taskGroupResolver(location);
      taskVersion = taskGroup.version;
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
