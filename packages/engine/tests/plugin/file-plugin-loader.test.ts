import { FilePluginLoader } from '@src/plugin/file-plugin-loader';
import { DEFAULT_LOGGER } from '@src/libs/log-helper';
import fs from 'fs';
import path from 'node:path';
import { getEntryPointDir } from '@letrun/core';

const jest = import.meta.jest;

describe('FilePluginLoader', () => {
  let loader: FilePluginLoader;
  const pluginDir = path.resolve(getEntryPointDir(), 'test-plugins');
  const mockModuleResolver = jest.fn();

  beforeEach(() => {
    loader = new FilePluginLoader('test-plugins', mockModuleResolver);
  });

  afterEach(() => {
    if (fs.existsSync(pluginDir)) {
      fs.rmSync(pluginDir, { recursive: true, force: true });
    }
  });

  it('loads plugins from the specified directory', async () => {
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }
    fs.writeFileSync(path.join(pluginDir, 'plugin1.js'), 'export default class Plugin1 {};');
    fs.writeFileSync(path.join(pluginDir, 'plugin2.cjs'), 'export default class Plugin2 {};');
    const mockPluginClass = jest.fn();
    mockModuleResolver.mockResolvedValue(mockPluginClass);

    const plugins = await loader.load();

    expect(plugins.length).toBe(2);
    expect(mockPluginClass).toHaveBeenCalledTimes(2);
  });

  it('returns an empty array if the plugin directory does not exist', async () => {
    if (fs.existsSync(pluginDir)) {
      fs.rmSync(pluginDir, { recursive: true, force: true });
    }

    const plugins = await loader.load();
    expect(plugins).toEqual([]);
  });

  it('logs a warning if no default export is found in a plugin file', async () => {
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }
    fs.writeFileSync(path.join(pluginDir, 'plugin1.js'), '');

    mockModuleResolver.mockResolvedValue(null);

    const mockLogWarn = jest.spyOn(DEFAULT_LOGGER, 'warn').mockImplementation();

    await loader.load();

    expect(mockLogWarn).toHaveBeenCalledWith(`No default export found in ${path.join(pluginDir, 'plugin1.js')}`);
  });

  it('logs an error if a plugin fails to load', async () => {
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }
    fs.writeFileSync(path.join(pluginDir, 'plugin1.js'), 'export default class Plugin1 {};');

    mockModuleResolver.mockRejectedValue(new Error('Load error'));

    const mockLogError = jest.spyOn(DEFAULT_LOGGER, 'error').mockImplementation();

    await loader.load();

    expect(mockLogError).toHaveBeenCalledWith(
      `Failed to load plugin from ${path.join(pluginDir, 'plugin1.js')}: Load error`,
    );
  });

  it('does not reload plugins if they are already loaded', async () => {
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }
    fs.writeFileSync(path.join(pluginDir, 'plugin1.js'), 'export default class Plugin1 {};');
    const mockPluginClass = jest.fn();
    mockModuleResolver.mockResolvedValue(mockPluginClass);

    await loader.load();
    const plugins = await loader.load();

    expect(plugins.length).toBe(1);
    expect(mockPluginClass).toHaveBeenCalledTimes(1);
  });
});
