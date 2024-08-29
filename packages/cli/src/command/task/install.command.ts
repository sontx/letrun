import { NpmPackage } from '@letrun/deps';
import { AbstractCommand } from '../abstract.command';
import { Command } from 'commander';
import ora from 'ora';

export class InstallCommand extends AbstractCommand {
  private npmPackage = new NpmPackage();

  load(program: Command): void {
    program
      .command('install')
      .description('install a task package')
      .argument('[name]', 'package name <name>@<version>')
      .action(async (name) => {
        await this.doAction(name);
      });
  }

  private async doAction(name?: string) {
    const spinner = ora('Installing package').start();
    try {
      await this.npmPackage.install(name);
      if (name) {
        spinner.succeed(`Package ${name} installed`);
      } else {
        spinner.succeed('All packages installed');
      }
      return true;
    } catch (e: any) {
      spinner.fail(e.message);
      return false;
    }
  }
}
