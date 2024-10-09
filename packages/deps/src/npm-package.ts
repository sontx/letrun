import type { PackageJson } from 'type-fest';
import fs from 'node:fs';
import { getEntryPointDir } from '@letrun/core';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'util';
import { Dependency } from '@src/model';

const execAsync = promisify(exec);

/**
 * Class representing an NPM package manager.
 */
export class NpmPackage {
  constructor(
    private name = 'letrun',
    private workingDir = getEntryPointDir(),
  ) {}

  /**
   * Installs dependencies or adds a specific dependency.
   * @param packageName - The name of the package to add as a dependency.
   * @param args - Additional arguments to pass to the `npm install` command.
   */
  async install(packageName?: string, args?: string) {
    if (!fs.existsSync(`${this.workingDir}/package.json`)) {
      await this.init();
    }

    if (packageName) {
      return await this.addDep(packageName, args);
    } else {
      return await this.installDeps(args);
    }
  }

  private async addDep(packageName: string, args?: string) {
    return await execAsync(`npm install ${packageName} --package-lock=false ${args ?? ''}`.trim(), {
      cwd: this.workingDir,
    });
  }

  private async installDeps(args?: string) {
    return await execAsync(`npm install --package-lock=false ${args ?? ''}`.trim(), { cwd: this.workingDir });
  }

  /**
   * Lists all dependencies of the package.
   * @returns A promise that resolves to an array of dependencies.
   */
  async list(): Promise<Dependency[]> {
    if (!fs.existsSync(`${this.workingDir}/package.json`)) {
      return [];
    }

    const packageJson: PackageJson = await fs.promises
      .readFile(`${this.workingDir}/package.json`, 'utf-8')
      .then(JSON.parse);
    const dependencies = packageJson.dependencies || {};
    const result: Dependency[] = [];

    for (const name of Object.keys(dependencies)) {
      const versionOrFile = dependencies[name] ?? '';
      if (versionOrFile.startsWith('file:')) {
        const packageLocation = versionOrFile.slice(5);
        const packageJsonPath = path.resolve(this.workingDir, packageLocation, 'package.json');
        const packageJson: PackageJson = fs.existsSync(packageJsonPath)
          ? await fs.promises.readFile(packageJsonPath, 'utf-8').then(JSON.parse)
          : {};
        result.push({
          name,
          version: packageJson.version ?? 'unknown',
          location: packageLocation,
        });
      } else {
        result.push({
          name,
          version: versionOrFile,
          location: `node_modules/${name}`,
        });
      }
    }

    return result;
  }

  private async init() {
    const packageJson: PackageJson = {
      name: this.name,
      type: 'module',
      main: `${this.name}.mjs`,
    };
    await fs.promises.writeFile(path.join(this.workingDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  }
}
