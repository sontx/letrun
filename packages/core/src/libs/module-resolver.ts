import path from 'node:path';
import { getEntryPointDir, isRelativePath } from '../utils';
import * as fs from 'node:fs';
import type { PackageJson } from 'type-fest';

export type ModuleResolverFn = <T = any>(modulePath: string) => Promise<T>;

/**
 * Class responsible for resolving exported default entry point of node module from module directory or file path.
 */
export class ModuleResolver {
  /**
   * Resolves a module or file path to its corresponding module.
   * @param {string} modulePath - The path to the module or file.
   * @returns {Promise<T>} - The resolved module.
   */
  resolve: ModuleResolverFn = async <T = any>(modulePath: string): Promise<T> => {
    const effectivePath = isRelativePath(modulePath) ? path.resolve(getEntryPointDir(), modulePath) : modulePath;
    if (await this.isFile(effectivePath)) {
      const moduleType = effectivePath.endsWith('.cjs') ? 'commonjs' : 'module';
      return await this.resolveFile(effectivePath, moduleType);
    }
    return await this.resolveModule(effectivePath);
  };

  private async resolveFile<T = any>(filePath: string, type: 'commonjs' | 'module'): Promise<T> {
    const obj = await this.dynamicImport(`file://${filePath}`);
    return type === 'commonjs' ? obj.default?.default : obj.default;
  }

  private async dynamicImport(filePath: string) {
    return await import(filePath);
  }

  private async resolveModule<T = any>(modulePath: string): Promise<T> {
    const packageJson = await this.readPackageJson(modulePath);
    const main = packageJson.main ?? 'index.js';
    let mainPath = path.join(modulePath, main);
    if (!packageJson.main && !fs.existsSync(mainPath)) {
      mainPath = path.join(modulePath, 'index.cjs');
    }
    const type = packageJson.type || 'commonjs';
    return await this.resolveFile(mainPath, type);
  }

  private async readPackageJson(modulePath: string): Promise<PackageJson> {
    const packageJsonPath = path.join(modulePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json not found in ${modulePath}`);
    }
    const packageJson = await fs.promises.readFile(packageJsonPath, 'utf8');
    return JSON.parse(packageJson) as PackageJson;
  }

  private async isFile(modulePath: string) {
    const stat = await fs.promises.stat(modulePath);
    return stat.isFile();
  }
}

export const defaultModuleResolver = new ModuleResolver();
