import {
  AbstractPlugin,
  AppContext,
  getEntryPointDir,
  Persistence,
  PERSISTENCE_PLUGIN,
  PersistenceUnit,
} from '@letrun/core';
import fs from 'fs';
import path from 'node:path';

export class FilePersistenceUnit implements PersistenceUnit {
  private readonly dataDir: string;

  constructor(name: string, dataDir: string) {
    this.dataDir = path.join(dataDir, name);
  }

  async save(id: string, data: any) {
    await this.ensureDirExists();
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const filePath = path.join(this.dataDir, id + '.json');
    await fs.promises.writeFile(filePath, content, { encoding: 'utf-8' });
  }

  async load(id: string) {
    await this.ensureDirExists();
    const filePath = path.join(this.dataDir, id + '.json');
    if (!fs.existsSync(filePath)) {
      return undefined;
    }
    const content = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
    return JSON.parse(content);
  }

  async remove(id: string) {
    await this.ensureDirExists();
    const filePath = path.join(this.dataDir, id + '.json');
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async list() {
    await this.ensureDirExists();
    const files = await fs.promises.readdir(this.dataDir);
    return files.map((file) => file.replace(/\.json$/, ''));
  }

  private async ensureDirExists() {
    if (!fs.existsSync(this.dataDir)) {
      await fs.promises.mkdir(this.dataDir, { recursive: true });
    }
  }
}

export default class FilePersistence extends AbstractPlugin implements Persistence {
  readonly name = 'file';
  readonly type = PERSISTENCE_PLUGIN;

  private units = new Map<string, FilePersistenceUnit>();
  private dataDir = 'data';

  getUnit(name: string): PersistenceUnit {
    if (!this.units.has(name)) {
      this.units.set(name, new FilePersistenceUnit(name, this.dataDir));
    }
    return this.units.get(name)!;
  }

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    const dataDir = await context.getConfigProvider().get('persistence.dir', 'data');
    this.dataDir = path.resolve(getEntryPointDir(), dataDir);
  }
}
