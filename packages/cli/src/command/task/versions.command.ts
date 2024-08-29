import { NpmPackage } from '@letrun/deps';
import { AbstractCommand } from '../abstract.command';
import { Command } from 'commander';
import ora from 'ora';
import { EMOJIS } from '@src/ui';

export class VersionsCommand extends AbstractCommand {
  private npmPackage = new NpmPackage();

  load(program: Command): void {
    program
      .command('versions')
      .description('show versions of installed packages')
      .action(async () => {
        await this.doAction();
      });
  }

  private async doAction() {
    const spinner = ora('Scan packages').start();
    try {
      const deps = await this.npmPackage.list();
      spinner.succeed(`Total packages: ${deps.length}\n`);
      console.log(deps.map((dep) => `${EMOJIS.PACKAGE} ${dep.name}@${dep.version}`).join('\n'));
      return true;
    } catch (e: any) {
      spinner.fail(e.message);
      return false;
    }
  }
}
