import type * as Transport from 'winston-transport';
import colors from 'colors/safe';
import type { TransformableInfo } from 'logform';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';
import { inspect, InspectOptions } from 'util';
import { format, transports } from 'winston';
import { AbstractPlugin, BUILTIN_PLUGIN_PRIORITY, LOG_TRANSPORT_PLUGIN, LogTransportPlugin } from '@letrun/core';
import { AppContext } from '@letrun/common';

export default class ConsoleLogger extends AbstractPlugin implements LogTransportPlugin {
  private options?: ConsoleFormatOptions;

  readonly name = 'console';
  readonly type = LOG_TRANSPORT_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  getTransport(): Transport {
    const consoleFormat = new ConsoleFormat(this.options ?? {}) as any;
    const formats = [
      format.ms(),
      format.errors({ stack: false }),
      format.splat(),
      format.json(),
      format.colorize({ all: true }),
      format.padLevels(),
      consoleFormat,
    ];
    if (this.options?.showTimestamp) {
      formats.unshift(format.timestamp({ format: this.options.timestampFormat }));
    }
    return new transports.Console({
      format: format.combine(...formats),
    });
  }

  protected async doLoad(context: AppContext) {
    const configProvider = context.getConfigProvider();
    const showMeta = await configProvider.getBoolean('logger.console.showMeta', true);
    const metaStrip = (await configProvider.get('logger.console.metaStrip', 'timestamp,service')).split(',');
    const showTimestamp = await configProvider.getBoolean('logger.console.showTimestamp', true);
    const timestampFormat = await configProvider.get('logger.console.timestampFormat', 'HH:mm:ss.SSS');
    const inspectOptionsDepth = await configProvider.getInt('logger.console.inspectOptions.depth', Infinity);
    const inspectOptionsColors = await configProvider.getBoolean('logger.console.inspectOptions.colors', true);
    const inspectOptionsMaxArrayLength = await configProvider.getInt(
      'logger.console.inspectOptions.maxArrayLength',
      Infinity,
    );
    const inspectOptionsBreakLength = await configProvider.getInt('logger.console.inspectOptions.breakLength', 120);
    const inspectOptionsCompact = await configProvider.getInt('logger.console.inspectOptions.compact', Infinity);
    this.options = {
      showMeta,
      metaStrip,
      showTimestamp,
      timestampFormat,
      inspectOptions: {
        depth: inspectOptionsDepth < 0 ? Infinity : inspectOptionsDepth,
        colors: inspectOptionsColors,
        maxArrayLength: inspectOptionsMaxArrayLength < 0 ? Infinity : inspectOptionsMaxArrayLength,
        breakLength: inspectOptionsBreakLength,
        compact: inspectOptionsCompact < 0 ? Infinity : inspectOptionsCompact,
      },
    };
  }
}

interface ConsoleFormatOptions {
  showMeta?: boolean;
  showTimestamp?: boolean;
  timestampFormat?: string;
  metaStrip?: string[];
  inspectOptions?: InspectOptions;
}

// source: https://github.com/duccio/winston-console-format
class ConsoleFormat {
  private static readonly reSpaces = /^\s+/;
  private static readonly reSpacesOrEmpty = /^(\s*)/;
  private static readonly reColor = /\x1B\[\d+m/;
  private static readonly defaultStrip = [LEVEL, MESSAGE, SPLAT, 'level', 'message', 'name', 'ms', 'stack'];
  private static readonly chars = {
    singleLine: '▪',
    startLine: '┏',
    line: '┃',
    endLine: '┗',
  };

  public constructor(private opts: ConsoleFormatOptions = {}) {
    if (typeof this.opts.showMeta === 'undefined') {
      this.opts.showMeta = true;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private inspector(value: any, messages: string[]): void {
    const inspector = inspect(value, this.opts.inspectOptions || {});

    inspector.split('\n').forEach((line) => {
      messages.push(line);
    });
  }

  private message(info: TransformableInfo, chr: string, color: string): string {
    const message = info.message.replace(
      ConsoleFormat.reSpacesOrEmpty,
      `$1${color}${colors.dim(chr)}${colors.reset(' ')}`,
    );

    return `${info.level}:${message}`;
  }

  private pad(message?: string): string {
    let spaces = '';
    const matches = message && message.match(ConsoleFormat.reSpaces);
    if (matches && matches.length > 0) {
      spaces = matches[0];
    }

    return spaces;
  }

  private ms(info: TransformableInfo): string {
    let ms = '';
    if (info.ms) {
      ms = colors.italic(colors.dim(` ${info.ms}`));
    }

    return ms;
  }

  private meta(info: TransformableInfo): string[] {
    const messages: string[] = [];
    const stripped = { ...info };

    ConsoleFormat.defaultStrip.forEach((e) => delete stripped[e]);
    this.opts.metaStrip && this.opts.metaStrip.forEach((e) => delete stripped[e]);

    if (Object.keys(stripped).length > 0) {
      this.inspector(stripped, messages);
    }

    return messages;
  }

  private getColor(info: TransformableInfo): string {
    let color = '';
    const colorMatch = info.level.match(ConsoleFormat.reColor);

    if (colorMatch) {
      color = colorMatch[0];
    }

    return color;
  }

  private write(info: TransformableInfo, messages: string[], color: string): void {
    const pad = this.pad(info.message);

    messages.forEach((line, index, arr) => {
      const lineNumber = colors.dim(`[${(index + 1).toString().padStart(arr.length.toString().length, ' ')}]`);
      let chr = ConsoleFormat.chars.line;
      if (index === arr.length - 1) {
        chr = ConsoleFormat.chars.endLine;
      }
      info[MESSAGE] += `\n${colors.dim(info.level)}:${pad}${color}${colors.dim(chr)}${colors.reset(' ')}`;
      info[MESSAGE] += `${lineNumber} ${line}`;
    });
  }

  public transform(info: TransformableInfo): TransformableInfo {
    const messages: string[] = [];

    if (this.opts.showMeta) {
      messages.push(...this.meta(info));
    }

    const color = this.getColor(info);

    info[MESSAGE] = this.message(info, ConsoleFormat.chars[messages.length > 0 ? 'startLine' : 'singleLine'], color);
    info[MESSAGE] += this.ms(info);

    this.write(info, messages, color);

    return info;
  }
}
