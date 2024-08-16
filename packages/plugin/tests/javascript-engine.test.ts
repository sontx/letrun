import JavascriptEngine from "@src/javascript-engine";

describe("JavascriptEngine", () => {
  it('returns undefined when script is empty', async () => {
    const engine = new JavascriptEngine();
    const result = await engine.run('', {});
    expect(result).toBeUndefined();
  });

  it('runs the script and returns the result', async () => {
    const engine = new JavascriptEngine();
    const script = 'const result = 1 + 1; result';
    const result = await engine.run(script, {});
    expect(result).toBe(2);
  });

  it('runs the script and returns a promise result', async () => {
    const engine = new JavascriptEngine();
    const script = 'const result = Promise.resolve(3); result';
    const result = await engine.run(script, {});
    expect(result).toBe(3);
  });

  it('executes a script with context and returns the result', async () => {
    const engine = new JavascriptEngine();
    const context = { a: 1, b: 2 };
    const script = 'a + b';
    const result = await engine.run(script, context);
    expect(result).toBe(3);
  });

  it('supports .js extension', () => {
    const engine = new JavascriptEngine();
    expect(engine.support('js')).toBe(true);
  });

  it('does not support non-.js extensions', () => {
    const engine = new JavascriptEngine();
    expect(engine.support('ts')).toBe(false);
  });
})
