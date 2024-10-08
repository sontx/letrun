import {
  Description,
  DisplayName,
  Icon,
  Keywords,
  Name,
  Output,
  Parameters,
  Version,
} from '@src/decorator/task-handler';
import Joi from 'joi';

describe('TaskHandler Decorators', () => {
  it('should inject name field into TaskHandler', () => {
    @Name('my-task-handler')
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).name).toBe('my-task-handler');
  });

  it('should inject version field into TaskHandler', () => {
    @Version('1.0.0')
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).version).toBe('1.0.0');
  });

  it('should inject description field into TaskHandler', () => {
    @Description('This is a task handler')
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).description).toBe('This is a task handler');
  });

  it('should inject parameters field into TaskHandler', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    @Parameters(schema)
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).parameters).toEqual(schema.describe());
  });

  it('should inject null parameters field into TaskHandler', () => {
    @Parameters(null)
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).parameters).toBeNull();
  });

  it('should inject parameters field with Joi description into TaskHandler', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    @Parameters(schema.describe())
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).parameters).toEqual(schema.describe());
  });

  it('should inject output field into TaskHandler', () => {
    const schema = Joi.object({
      result: Joi.string().required(),
    });

    @Output(schema)
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).output).toEqual(schema.describe());
  });

  it('should inject null output field into TaskHandler', () => {
    @Output(null)
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).output).toBeNull();
  });

  it('should inject output field with Joi description into TaskHandler', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    @Output(schema.describe())
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).output).toEqual(schema.describe());
  });

  it('should keep prototype methods after applying decorators', () => {
    class BaseClass {
      baseMethod() {
        return 'baseMethod';
      }
    }

    @Name('my-task-handler')
    @Version('1.0.0')
    @Description('This is a task handler')
    @Icon('https://example.com/icon.png')
    @Parameters(Joi.object({ name: Joi.string().required() }))
    @Output(Joi.object({ value: Joi.string().required() }))
    class MyTaskHandler extends BaseClass {}

    const instance = new MyTaskHandler();
    expect(instance.baseMethod()).toBe('baseMethod');
  });

  it('should apply all decorators correctly', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });
    const outputSchema = Joi.object({
      value: Joi.string().required(),
    });

    @Name('my-task-handler')
    @DisplayName('My Task Handler')
    @Version('1.0.0')
    @Description('This is a task handler')
    @Keywords('task', 'handler')
    @Parameters(schema)
    @Output(outputSchema)
    @Icon('https://example.com/icon.png')
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).name).toBe('my-task-handler');
    expect((instance as any).displayName).toBe('My Task Handler');
    expect((instance as any).version).toBe('1.0.0');
    expect((instance as any).description).toBe('This is a task handler');
    expect((instance as any).keywords).toEqual(['task', 'handler']);
    expect((instance as any).icon).toBe('https://example.com/icon.png');
    expect((instance as any).parameters).toEqual(schema.describe());
    expect((instance as any).output).toEqual(outputSchema.describe());
  });

  it('should inject icon field into TaskHandler', () => {
    @Icon('https://example.com/icon.png')
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).icon).toBe('https://example.com/icon.png');
  });

  it('should inject displayName field into TaskHandler', () => {
    @DisplayName('My Task Handler')
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).displayName).toBe('My Task Handler');
  });

  it('should inject keywords field into TaskHandler', () => {
    @Keywords('task', 'handler')
    class MyTaskHandler {}

    const instance = new MyTaskHandler();
    expect((instance as any).keywords).toEqual(['task', 'handler']);
  });
});
