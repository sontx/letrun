import DefaultInputParameter from '@src/default-input-parameter';
import fs from 'fs';

const jest = import.meta.jest;

describe('DefaultInputParameter', () => {
  let inputParameter: DefaultInputParameter;

  beforeEach(() => {
    inputParameter = new DefaultInputParameter();
  });

  it('returns null if rawInput is empty', async () => {
    const result = await inputParameter.read('');
    expect(result).toBeNull();
  });

  it('reads and parses JSON file content', async () => {
    const rawInput = 'input.json';
    const fileContent = '{"key": "value"}';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(fileContent);

    const result = await inputParameter.read(rawInput);
    expect(result).toEqual({ key: 'value' });
  });

  it('reads and parses YAML file content', async () => {
    const rawInput = 'input.yaml';
    const fileContent = 'key: value';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(fileContent);

    const result = await inputParameter.read(rawInput);
    expect(result).toEqual({ key: 'value' });
  });

  it('parses JSON string input', async () => {
    const rawInput = '{"key": "value"}';
    const result = await inputParameter.read(rawInput);
    expect(result).toEqual({ key: 'value' });
  });

  it('throws error for invalid JSON string input', async () => {
    const rawInput = '{"key": "value"';
    await expect(inputParameter.read(rawInput)).rejects.toThrow(SyntaxError);
  });

  it('throws error when cannot parse input value to JSON', async () => {
    const rawInput = 'invalid json string';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await expect(inputParameter.read(rawInput)).rejects.toThrow(/^Unexpected token/);
  });

  it('returns null if the file is not found', async () => {
    const rawInput = 'nonexistent.json';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await expect(inputParameter.read(rawInput)).rejects.toThrow(`File not found: ${rawInput}`);
  });
});
