import path from 'node:path';
import { getEntryPointDir, isRelativePath, readPackageJson } from '../utils';
import * as fs from 'node:fs';
import type { PackageJson } from 'type-fest';

export type ModuleResolverFn = <T = any>(modulePath: string) => Promise<T>;

/**
 * Class responsible for resolving exported entry point of node module from module directory or file path.
 */
export class ModuleResolver {
  constructor(private readonly rootDir = getEntryPointDir()) {}

  /**
   * Resolves a module or file path to its corresponding module.
   * @param {string} modulePath - The path to the module or file.
   * @returns {Promise<T>} - The resolved module.
   */
  resolve: ModuleResolverFn = async <T = any>(modulePath: string): Promise<T> => {
    const effectivePath = isRelativePath(modulePath) ? path.resolve(this.rootDir, modulePath) : modulePath;
    if (await this.isFile(effectivePath)) {
      const moduleType = effectivePath.endsWith('.cjs') ? 'commonjs' : 'module';
      return await this.resolveFile(effectivePath, moduleType);
    }
    return this.isInsideNodeModules(effectivePath)
      ? await this.resolveInsideNodeModules(effectivePath)
      : await this.resolveOutsideNodeModules(effectivePath);
  };

  private async resolveFile<T = any>(filePath: string, type: 'commonjs' | 'module'): Promise<T> {
    const obj = await this.dynamicImport(`file://${filePath}`);
    return this.resolveDefaultExport(obj, type);
  }

  private resolveDefaultExport<T = any>(obj: any, type: 'commonjs' | 'module'): T {
    if (!['commonjs', 'module'].includes(type)) {
      throw new Error(`Unsupported module type: ${type}`);
    }
    return type === 'commonjs' ? obj.default : obj;
  }

  private async dynamicImport(filePath: string) {
    return await import(filePath);
  }

  private async resolveOutsideNodeModules<T = any>(modulePath: string): Promise<T> {
    const packageJson = await this.readPackageJson(modulePath);
    const main = packageJson.main ?? 'index.js';
    let mainPath = path.join(modulePath, main);
    if (!packageJson.main && !fs.existsSync(mainPath)) {
      mainPath = path.join(modulePath, 'index.cjs');
    }
    const type = await this.getModuleType(packageJson);
    return await this.resolveFile(mainPath, type);
  }

  private async getModuleType(modulePathOrPackageJson: string | PackageJson) {
    if (typeof modulePathOrPackageJson === 'string') {
      const packageJson = await this.readPackageJson(modulePathOrPackageJson);
      return packageJson.type || 'commonjs';
    }
    return modulePathOrPackageJson.type || 'commonjs';
  }

  private isInsideNodeModules(modulePath: string) {
    return modulePath.includes('node_modules');
  }

  private async resolveInsideNodeModules(modulePath: string) {
    const moduleName = this.getModuleNameFromNodeModulesPath(modulePath);
    const obj = await this.dynamicImport(moduleName);
    const moduleType = await this.getModuleType(modulePath);
    return this.resolveDefaultExport(obj, moduleType);
  }

  private getModuleNameFromNodeModulesPath(modulePath: string) {
    return path.relative(path.resolve(this.rootDir, 'node_modules'), modulePath);
  }

  private async readPackageJson(modulePath: string): Promise<PackageJson> {
    return (await readPackageJson(modulePath))!;
  }

  private async isFile(modulePath: string) {
    const stat = await fs.promises.stat(modulePath);
    return stat.isFile();
  }
}

export const defaultModuleResolver = new ModuleResolver();
