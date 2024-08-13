import FilePersistence, { FilePersistenceUnit } from '@src/file-persistence';
import path from 'node:path';
import fs from 'fs';
import { AppContext } from '@letrun/core';

const jest = import.meta.jest;
const testDataDir = 'testDataDir';

beforeEach(async () => {
  if (fs.existsSync(testDataDir)) {
    await fs.promises.rm(testDataDir, { recursive: true, force: true });
  }
});

afterEach(async () => {
  if (fs.existsSync(testDataDir)) {
    await fs.promises.rm(testDataDir, { recursive: true, force: true });
  }
});

describe('FilePersistenceUnit', () => {
  it('saves data to a file', async () => {
    const unit = new FilePersistenceUnit('testUnit', testDataDir);
    await unit.save('testId', { key: 'value' });
    const filePath = path.join(testDataDir, 'testUnit', 'testId.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
    expect(JSON.parse(content)).toEqual({ key: 'value' });
  });

  it('loads data from a file', async () => {
    const unit = new FilePersistenceUnit('testUnit', testDataDir);
    await unit.save('testId', { key: 'value' });
    const data = await unit.load('testId');
    expect(data).toEqual({ key: 'value' });
  });

  it('returns undefined if file does not exist', async () => {
    const unit = new FilePersistenceUnit('testUnit', testDataDir);
    const data = await unit.load('nonExistentId');
    expect(data).toBeUndefined();
  });

  it('removes a file', async () => {
    const unit = new FilePersistenceUnit('testUnit', testDataDir);
    await unit.save('testId', { key: 'value' });
    await unit.remove('testId');
    const filePath = path.join(testDataDir, 'testUnit', 'testId.json');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('lists all files in the directory', async () => {
    const unit = new FilePersistenceUnit('testUnit', testDataDir);
    await unit.save('testId1', { key: 'value1' });
    await unit.save('testId2', { key: 'value2' });
    const files = await unit.list();
    expect(files).toEqual(['testId1', 'testId2']);
  });
});

describe('FilePersistence', () => {
  it('creates a new persistence unit if it does not exist', () => {
    const persistence = new FilePersistence();
    const unit = persistence.getUnit('newUnit');
    expect(unit).toBeInstanceOf(FilePersistenceUnit);
  });

  it('returns an existing persistence unit if it exists', () => {
    const persistence = new FilePersistence();
    const unit1 = persistence.getUnit('existingUnit');
    const unit2 = persistence.getUnit('existingUnit');
    expect(unit1).toBe(unit2);
  });

  it('loads configuration correctly', async () => {
    const context = {
      getConfigProvider: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue('customDataDir'),
      }),
    } as unknown as AppContext;
    const persistence = new FilePersistence();
    await persistence.load(context);
    expect(persistence['dataDir']).toContain('customDataDir');
  });

  it('unloads without errors', async () => {
    const persistence = new FilePersistence();
    await expect(persistence.unload()).resolves.toBeUndefined();
  });
});
