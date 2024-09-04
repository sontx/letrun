import { ModuleResolver } from '@src/libs';
import path from 'node:path';
import { getEntryPointDir } from '@src/utils';

const jest = import.meta.jest;

describe('ModuleResolver', () => {
  let moduleResolver: ModuleResolver;

  beforeEach(() => {
    jest.resetAllMocks();
    moduleResolver = new ModuleResolver();
  });

  describe('resolve from module file', () => {
    it('resolves a module from a relative file path', async () => {
      const relativeModulePath = './module.js';
      const fullPath = path.resolve(getEntryPointDir(), relativeModulePath);
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(true);
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockImplementation((modulePath: any) => {
        return `file://${fullPath}` === modulePath ? { default: 'resolvedModule' } : undefined;
      });

      const result = await moduleResolver.resolve(relativeModulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('resolves a module from an absolute file path', async () => {
      const absoluteModulePath = '/absolute/path/module.js';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(true);
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockImplementation((modulePath: any) => {
        return `file://${absoluteModulePath}` === modulePath ? { default: 'resolvedModule' } : undefined;
      });

      const result = await moduleResolver.resolve(absoluteModulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('throws an error if the module file does not exist', async () => {
      const nonExistentModulePath = '/non/existent/module.js';
      jest.spyOn(moduleResolver as any, 'isFile').mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(moduleResolver.resolve(nonExistentModulePath)).rejects.toThrow('File not found');
    });

    it('resolves a module file with commonjs type', async () => {
      const commonjsModulePath = '/absolute/path/module.cjs';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(true);
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockImplementation((modulePath: any) => {
        return `file://${commonjsModulePath}` === modulePath
          ? { default: { default: 'resolvedCommonJSModule' } }
          : undefined;
      });

      const result = await moduleResolver.resolve(commonjsModulePath);
      expect(result).toEqual({ default: 'resolvedCommonJSModule' });
    });
  });

  describe('resolve from module directory', () => {
    it('resolves a module when package.json main field is missing', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(false);
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockImplementation((resolveModule: any) => {
        return `file://${path.join(modulePath, 'index.cjs')}` === resolveModule
          ? { default: 'resolvedModule' }
          : undefined;
      });
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockResolvedValue({
        type: 'module',
      });

      const result = await moduleResolver.resolve(modulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('throws an error when package.json main field points to a non-existent file', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockImplementation(() => false);
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockResolvedValue({ main: 'non-existent.js' });

      await expect(moduleResolver.resolve(modulePath)).rejects.toThrow();
    });

    it('resolves a module as commonjs when package.json type field is missing', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(false);
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockImplementation((resolveModule: any) => {
        return `file://${path.join(modulePath, 'index.js')}` === resolveModule
          ? { default: { default: 'resolvedModule' } }
          : undefined;
      });
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockResolvedValue({ main: 'index.js' });

      const result = await moduleResolver.resolve(modulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('throws an error when package.json type field is invalid', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(false);
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockImplementation((modulePath: any) => {
        return `file://${path.join(modulePath, 'index.js')}` === modulePath ? { default: 'resolvedModule' } : undefined;
      });
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockResolvedValue({ main: 'index.js', type: 'invalid' });

      await expect(moduleResolver.resolve(modulePath)).rejects.toThrow();
    });

    it('resolves a module when package.json main field is present', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(false);
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockResolvedValue({ main: 'main.js' });
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockResolvedValue({ default: { default: 'resolvedModule' } });

      const result = await moduleResolver.resolve(modulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('resolves a module when package.json has type set to module', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(false);
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockResolvedValue({ main: 'index.js', type: 'module' });
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockResolvedValue({ default: 'resolvedModule' });

      const result = await moduleResolver.resolve(modulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('resolves a module when package.json has type set to module, prioritizing type over file extension', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(false);
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockResolvedValue({ main: 'index.cjs', type: 'module' });
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockResolvedValue({ default: 'resolvedModule' });

      const result = await moduleResolver.resolve(modulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('resolves a module when package.json has type set to commonjs, prioritizing type over file extension', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(false);
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockResolvedValue({ main: 'index.js', type: 'commonjs' });
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockResolvedValue({ default: { default: 'resolvedModule' } });

      const result = await moduleResolver.resolve(modulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('throws an error when package.json is missing', async () => {
      const modulePath = '/absolute/path/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockResolvedValue(false);
      jest.spyOn(moduleResolver as any, 'readPackageJson').mockImplementation(() => {
        throw new Error('package.json not found in /absolute/path/module');
      });

      await expect(moduleResolver.resolve(modulePath)).rejects.toThrow('package.json not found in /absolute/path/module');
    });
  });

  describe('resolve from node_modules', () => {
    it('resolves a module from node_modules', async () => {
      const modulePath = '/absolute/path/node_modules/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockReturnValue(false);
      jest.spyOn(moduleResolver as any, 'isInsideNodeModules').mockReturnValue(true);
      jest.spyOn(moduleResolver as any, 'getModuleNameFromNodeModulesPath').mockReturnValue('module');
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockResolvedValue({ default: 'resolvedModule' });
      jest.spyOn(moduleResolver as any, 'getModuleType').mockResolvedValue('module');

      const result = await moduleResolver.resolve(modulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('resolves a module from node_modules with commonjs type', async () => {
      const modulePath = '/absolute/path/node_modules/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockReturnValue(false);
      jest.spyOn(moduleResolver as any, 'isInsideNodeModules').mockReturnValue(true);
      jest.spyOn(moduleResolver as any, 'getModuleNameFromNodeModulesPath').mockReturnValue('module');
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockResolvedValue({ default: { default: 'resolvedModule' } });
      jest.spyOn(moduleResolver as any, 'getModuleType').mockResolvedValue('commonjs');

      const result = await moduleResolver.resolve(modulePath);
      expect(result).toEqual({ default: 'resolvedModule' });
    });

    it('throws an error when module type is invalid', async () => {
      const modulePath = '/absolute/path/node_modules/module';
      jest.spyOn(moduleResolver as any, 'isFile').mockReturnValue(false);
      jest.spyOn(moduleResolver as any, 'isInsideNodeModules').mockReturnValue(true);
      jest.spyOn(moduleResolver as any, 'getModuleNameFromNodeModulesPath').mockReturnValue('module');
      jest.spyOn(moduleResolver as any, 'dynamicImport').mockResolvedValue({ default: 'resolvedModule' });
      jest.spyOn(moduleResolver as any, 'getModuleType').mockResolvedValue('invalid');

      await expect(moduleResolver.resolve(modulePath)).rejects.toThrow();
    });
  });
});
