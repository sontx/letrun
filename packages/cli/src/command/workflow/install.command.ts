import { AbstractCommand, AbstractOptions } from '../abstract.command';
import { Command } from 'commander';
import { NpmPackage, WorkflowDepsScanner } from '@letrun/deps';
import ora from 'ora';
import {
  extractPackageNameVersion,
  INPUT_PARAMETER_PLUGIN,
  InputParameter,
  MODULE_LOCATION_RESOLVER_PLUGIN,
  ModuleLocationResolver,
  WorkflowDef,
} from '@letrun/core';
import { SystemTaskManager } from '@letrun/engine';

export class InstallCommand extends AbstractCommand {
  private npmPackage = new NpmPackage();

  load(program: Command): void {
    program
      .command('install')
      .description("install a workflow's dependencies")
      .argument('<path>', 'path to the workflow file either in JSON or YAML format')
      .option('-d, --dry-run', 'report what it would have done')
      .action(async (path, options) => {
        await this.doAction(path, options);
      });
  }

  private async doAction(path: string, options: AbstractOptions) {
    const scanner = await this.getScanner();
    const inputParameter = await this.context.getPluginManager().getOne<InputParameter>(INPUT_PARAMETER_PLUGIN);
    const workflow = await inputParameter.read<WorkflowDef>(path);

    const deps = await scanner.scan(workflow!);
    const installableDeps = deps
      .filter((dep) => dep.type === 'package')
      .map((dep) => ({
        handler: dep.handler,
        version: dep.requireVersion || dep.version,
      }));
    if (!installableDeps.length) {
      this.context.getLogger().info('No dependencies to install');
      return;
    }

    const spinner = ora(`Installing ${installableDeps.length} package(s)`).start();
    try {
      const { stdout, stderr } = await this.npmPackage.install(
        installableDeps
          .map((dep) => {
            const { name } = extractPackageNameVersion(dep.handler!);
            return `${name}@${dep.version}`;
          })
          .join(' '),
        options.dryRun ? '--dry-run' : undefined,
      );

      if (stderr) {
        spinner.fail("Couldn't install packages\n");
        this.context.getLogger().error(stderr.trim());
      } else {
        spinner.succeed('Packages installed successfully\n');
        console.log(stdout?.trim());
      }
      return true;
    } catch (e: any) {
      spinner.fail(e.message);
      return false;
    }
  }

  private async getScanner() {
    const scanner = new WorkflowDepsScanner();
    scanner.locationResolver = async (module: string, modulesDir?: string) => {
      return this.context
        .getPluginManager()
        .callPluginMethod<ModuleLocationResolver>(
          MODULE_LOCATION_RESOLVER_PLUGIN,
          'resolveLocation',
          module,
          modulesDir,
        );
    };
    const systemTasks = Object.keys(SystemTaskManager.getSystemTasks());
    scanner.checkSystemDependencyFn = (handler) => systemTasks.includes(handler);
    return scanner;
  }
}
