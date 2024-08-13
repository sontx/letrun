import { FIELD_TRANSFORMERS } from '@src/command/libs';

describe('FIELD_TRANSFORMERS', () => {
  it('transforms timeCompleted field correctly', () => {
    const result = FIELD_TRANSFORMERS.timeCompleted!('2023-10-01T12:00:00Z');
    expect(result).toBe(new Date('2023-10-01T12:00:00Z').toLocaleString());
  });

  it('transforms timeStarted field correctly', () => {
    const result = FIELD_TRANSFORMERS.timeStarted!('2023-10-01T12:00:00Z');
    expect(result).toBe(new Date('2023-10-01T12:00:00Z').toLocaleString());
  });

  it('transforms timeOpened field correctly', () => {
    const result = FIELD_TRANSFORMERS.timeOpened!('2023-10-01T12:00:00Z');
    expect(result).toBe(new Date('2023-10-01T12:00:00Z').toLocaleString());
  });

  it('transforms handlerDuration field correctly', () => {
    const result = FIELD_TRANSFORMERS.handlerDuration!(123);
    expect(result).toBe('123 ms');
  });

  it('transforms totalDuration field correctly', () => {
    const result = FIELD_TRANSFORMERS.totalDuration!(456);
    expect(result).toBe('456 ms');
  });

  it('returns empty string for null timeCompleted', () => {
    const result = FIELD_TRANSFORMERS.timeCompleted!(null);
    expect(result).toBe('');
  });

  it('returns empty string for null handlerDuration', () => {
    const result = FIELD_TRANSFORMERS.handlerDuration!(null);
    expect(result).toBe('');
  });

  it('returns empty string for undefined timeStarted', () => {
    const result = FIELD_TRANSFORMERS.timeStarted!(undefined);
    expect(result).toBe('');
  });

  it('returns empty string for undefined totalDuration', () => {
    const result = FIELD_TRANSFORMERS.totalDuration!(undefined);
    expect(result).toBe('');
  });
});
