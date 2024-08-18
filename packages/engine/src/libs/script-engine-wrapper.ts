import { ScriptEngine } from '@letrun/core';

export class ScriptEngineWrapper {
  constructor(
    private readonly scriptEngines: ScriptEngine[],
    private readonly defaultLanguage: string = 'javascript',
  ) {}

  async run(expression: string, options: { language?: string; file?: string; input?: any }) {
    const fileExtension = options.file?.split('.').pop()?.toLowerCase();
    const matchedEngine = this.findScriptEngine(options.language?.toLowerCase(), fileExtension);

    if (!matchedEngine) {
      if (fileExtension) {
        throw new Error(`No script engine found for file extension: ${fileExtension}`);
      }
      throw new Error(`No script engine found for language: ${options.language}`);
    }

    return await matchedEngine.run(expression, { input: options.input });
  }

  private findScriptEngine(language: string | undefined, fileExtension: string | undefined) {
    if (!language && !fileExtension) {
      language = this.defaultLanguage;
    }
    if (language) {
      return this.scriptEngines.find((engine) => engine.name === language);
    }
    if (fileExtension) {
      return this.scriptEngines.find((engine) => engine.support(fileExtension));
    }
    return undefined;
  }
}
