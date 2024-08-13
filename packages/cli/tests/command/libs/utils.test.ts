import { getOptionValue } from '@src/command/libs';

describe('getOptionValue', () => {
  it('returns the value of the short option if specified', () => {
    process.argv = ['node', 'script.js', '-o', 'value'];
    const result = getOptionValue('-o', '--option');
    expect(result).toBe('value');
  });

  it('returns the value of the long option if specified', () => {
    process.argv = ['node', 'script.js', '--option', 'value'];
    const result = getOptionValue('-o', '--option');
    expect(result).toBe('value');
  });

  it('returns null if the option is not specified', () => {
    process.argv = ['node', 'script.js'];
    const result = getOptionValue('-o', '--option');
    expect(result).toBeNull();
  });

  it('returns null if the option is specified without a value', () => {
    process.argv = ['node', 'script.js', '-o'];
    const result = getOptionValue('-o', '--option');
    expect(result).toBeNull();
  });

  it('returns the value of the first occurrence if both short and long options are specified', () => {
    process.argv = ['node', 'script.js', '-o', 'shortValue', '--option', 'longValue'];
    const result = getOptionValue('-o', '--option');
    expect(result).toBe('shortValue');
  });

  it('returns the value of the long option if short option is not specified', () => {
    process.argv = ['node', 'script.js', '--option', 'longValue'];
    const result = getOptionValue('-o', '--option');
    expect(result).toBe('longValue');
  });

  it('handles options with equal signs', () => {
    process.argv = ['node', 'script.js', '--option=value'];
    const result = getOptionValue('-o', '--option');
    expect(result).toBe('value');
  });

  it('handles options with spaces and equal signs', () => {
    process.argv = ['node', 'script.js', '--option', 'value', '-o=value'];
    const result = getOptionValue('-o', '--option');
    expect(result).toBe('value');
  });
});
