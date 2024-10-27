import fs from 'node:fs';
import path from 'node:path';
import { NpmPackage } from '@src/npm-package';
import { expect } from '@jest/globals';

const jest = import.meta.jest;

describe('NpmPackage', () => {
  let npmPackage: NpmPackage;
  let addDepMock: jest.Mock;
  let installDeps: jest.Mock;
  const workingDir = '/mock/working/dir';

  beforeEach(() => {
    jest.resetAllMocks();

    npmPackage = new NpmPackage('letrun', workingDir);
    addDepMock = jest.spyOn(npmPackage as any, 'addDep').mockResolvedValue(undefined) as any;
    installDeps = jest.spyOn(npmPackage as any, 'installDeps').mockResolvedValue(undefined) as any;
  });

  it('installs dependencies when package.json exists', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    await npmPackage.install();

    expect(installDeps).toHaveBeenCalledTimes(1);
    expect(addDepMock).not.toHaveBeenCalled();
  });

  it('adds a dependency when package.json exists', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    await npmPackage.install('some-package');

    expect(addDepMock).toHaveBeenCalledWith('some-package', undefined);
    expect(installDeps).not.toHaveBeenCalled();
  });

  it('initializes package.json when it does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const writeFileMock = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

    await npmPackage.install();

    expect(writeFileMock).toHaveBeenCalledWith(
      path.join(workingDir, 'package.json'),
      JSON.stringify({ name: 'letrun', type: 'module', main: 'letrun.mjs' }, null, 2),
    );
    expect(installDeps).toHaveBeenCalledTimes(1);
  });

  it('lists dependencies', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValueOnce(
        JSON.stringify({
          dependencies: {
            dep1: '1.0.0',
            dep2: 'file:../dep2',
          },
        }),
      )
      .mockResolvedValueOnce(JSON.stringify({ version: '2.0.0' }));
    const dependencies = await npmPackage.list();

    expect(dependencies).toEqual([
      { name: 'dep1', version: '1.0.0', location: 'node_modules/dep1' },
      { name: 'dep2', version: '2.0.0', location: '../dep2' },
    ]);
  });

  it('returns an empty list when package.json does not contain dependencies field', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(
      JSON.stringify({
        name: 'letrun',
        version: '1.0.0',
      }),
    );

    const dependencies = await npmPackage.list();

    expect(dependencies).toEqual([]);
  });

  it('returns dependency with version "unknown" when dep location not found', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(
      JSON.stringify({
        dependencies: {
          dep1: 'file:../dep1',
        },
      }),
    );
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true).mockReturnValueOnce(false);

    const dependencies = await npmPackage.list();

    expect(dependencies).toEqual([{ name: 'dep1', version: 'unknown', location: '../dep1' }]);
  });

  it('returns dependency with version "unknown" when dep package.json version not found', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        dependencies: {
          dep1: 'file:../dep1',
        },
      }),
    );
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(JSON.stringify({}));

    const dependencies = await npmPackage.list();

    expect(dependencies).toEqual([{ name: 'dep1', version: 'unknown', location: '../dep1' }]);
  });
});
