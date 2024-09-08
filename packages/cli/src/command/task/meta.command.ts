import { NpmPackage } from '@letrun/deps';
import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import ora from 'ora';
import { ParsedHandler, SYSTEM_TASK_GROUP, TaskHandler } from '@letrun/common';
import {
  defaultTaskHandlerParser,
  METADATA_EXTRACTOR,
  MetadataExtractor,
  TASK_HANDLER_LOCATION_RESOLVER_PLUGIN,
  TaskHandlerLocationResolver,
} from '@letrun/core';
import fs from 'fs';
import { SystemTaskManager } from '@letrun/engine';
import { LogHelper } from '../libs/log-helper';

export class MetaCommand extends AbstractCommand {
  private npmPackage = new NpmPackage();

  load(program: Command): void {
    program
      .command('meta')
      .description('extract metadata from a task')
      .argument('[name]', 'package name <name>@<version>')
      .option('-p, --pipe', 'Pipe the output to the next command', false)
      .option('-o, --output <output>', 'Output file which contains the metadata')
      .action(async (name, options) => {
        if (options.pipe) {
          await LogHelper.usePipeMode(this.context, async () => {
            return await this.doAction(name, options);
          });
        } else {
          await this.doAction(name, options);
        }
      });
  }

  private async doAction(name?: string, options?: AbstractOptions) {
    const doExtract = async () => {
      const extractor = await this.context.getPluginManager().getOne<MetadataExtractor>(METADATA_EXTRACTOR);
      const systemTasks = SystemTaskManager.getSystemTasks() ?? {};

      if (!name) {
        return await extractor.extract({
          ...SYSTEM_TASK_GROUP,
          tasks: systemTasks,
        });
      }

      if (systemTasks[name]) {
        return await this.extractSystemTask(systemTasks[name]!, extractor);
      } else if (fs.existsSync(name)) {
        return await this.extractFromPath(name, extractor);
      }
      return await this.extractFromPackage(name, extractor);
    };

    const metadata = await doExtract();
    if (options?.output) {
      await fs.promises.writeFile(options.output, JSON.stringify(metadata, null, 2), 'utf8');
    }
    return metadata;
  }

  private async extractSystemTask(taskHandler: TaskHandler, extractor: MetadataExtractor) {
    return await extractor.extract({
      ...SYSTEM_TASK_GROUP,
      tasks: {
        [taskHandler.name!]: taskHandler,
      },
    });
  }

  private async extractFromPath(path: string, extractor: MetadataExtractor) {
    const stat = await fs.promises.stat(path);
    const parsedHandler: ParsedHandler = {
      name: path,
      type: stat.isDirectory() ? 'external' : 'script',
    };
    return await extractor.extract(parsedHandler);
  }

  private async extractFromPackage(name: string, extractor: MetadataExtractor) {
    const parsedHandler = defaultTaskHandlerParser.parse(name);

    const location = await this.context!.getPluginManager().callPluginMethod<TaskHandlerLocationResolver, string>(
      TASK_HANDLER_LOCATION_RESOLVER_PLUGIN,
      'resolveLocation',
      parsedHandler,
      false,
    );

    if (!location) {
      if (parsedHandler.type !== 'package') {
        throw new Error(`Cannot find module: ${name}`);
      }

      const effectivePackageName = parsedHandler.version
        ? `${parsedHandler.name}@${parsedHandler.version}`
        : parsedHandler.name;
      const installed = await this.installPackage(effectivePackageName);

      if (!installed) {
        throw new Error(`Cannot find module: ${name}`);
      }
    }

    return await extractor.extract(parsedHandler);
  }

  private async installPackage(name: string) {
    const spinner = ora(`Package ${name} was not found, installing...`).start();
    try {
      await this.npmPackage.install(name);
      spinner.succeed(`Package ${name} installed`);
      return true;
    } catch (e: any) {
      spinner.fail(e.message);
      return false;
    }
  }
}
