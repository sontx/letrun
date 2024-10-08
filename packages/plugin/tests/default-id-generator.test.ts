import { AppContext } from '@letrun/common';
import DefaultIdGenerator from '@src/default-id-generator';
import { Subject } from "rxjs";

const jest = import.meta.jest;

describe('DefaultIdGenerator', () => {
  let idGenerator: DefaultIdGenerator;

  beforeEach(() => {
    idGenerator = new DefaultIdGenerator();
  });

  it('generates unique IDs without parent ID', () => {
    expect(idGenerator.generateId()).toBe('0');
    expect(idGenerator.generateId()).toBe('1');
  });

  it('generates unique IDs with parent ID', () => {
    expect(idGenerator.generateId('parent')).toBe('parent/0');
    expect(idGenerator.generateId('parent')).toBe('parent/1');
  });

  it('returns undefined for parent ID when no separator is present', () => {
    expect(idGenerator.getParentId('0')).toBe('');
  });

  it('returns parent ID when separator is present', () => {
    expect(idGenerator.getParentId('parent/0')).toBe('parent');
  });

  it('loads configuration into the plugin', async () => {
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      })),
      getConfigProvider: jest.fn().mockReturnValue({
        getAll: jest.fn().mockResolvedValue({
          'id-generator': {
            default: { idSeparator: '-' },
          },
        }),
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;

    await idGenerator.load(context);
    expect(idGenerator['idSeparator']).toBe('-');
  });

  it('unloads without errors', async () => {
    await expect(idGenerator.unload()).resolves.not.toThrow();
  });
});
