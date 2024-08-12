import { IdGenerator } from './id-generator';

describe('IdGenerator', () => {
  it('generates unique IDs without parent ID', () => {
    const generator = new IdGenerator();
    expect(generator.generateId()).toBe('0');
    expect(generator.generateId()).toBe('1');
  });

  it('generates unique IDs with parent ID', () => {
    const generator = new IdGenerator();
    expect(generator.generateId('parent')).toBe('parent/0');
    expect(generator.generateId('parent')).toBe('parent/1');
  });

  it('uses custom separator for IDs', () => {
    const generator = new IdGenerator('-');
    expect(generator.generateId('parent')).toBe('parent-0');
    expect(generator.generateId('parent')).toBe('parent-1');
  });

  it('extracts parent ID correctly', () => {
    expect(IdGenerator.getParentId('parent/0')).toBe('parent');
    expect(IdGenerator.getParentId('parent/child/0')).toBe('parent/child');
  });

  it('returns empty if no parent ID exists', () => {
    expect(IdGenerator.getParentId('0')).toBe('');
  });

  it('extracts parent ID with custom separator', () => {
    expect(IdGenerator.getParentId('parent-0', '-')).toBe('parent');
    expect(IdGenerator.getParentId('parent-child-0', '-')).toBe('parent-child');
  });
});
