import { Command } from 'commander';
import { CommandLoader } from './command';
import { BANNER, EMOJIS } from './ui';
import { DefaultContext } from './runner';
import { AppContext, COMMAND_PLUGIN, CommandPlugin } from '@letrun/core';
import { DEFAULT_LOGGER } from '@src/libs/log-helper';
import { getOptionValue } from '@src/command/libs';

async function setupLogLevel(context: AppContext) {
  const logLevel = getOptionValue('-l', '--log') ?? 'warn';
  DEFAULT_LOGGER.setLevel(logLevel);
  await context.getConfigProvider().set('logger.level', logLevel);
}

const bootstrap = async () => {
  const program = new Command();
  program
    .name('letrun')
    .description(process.env.APP_DESCRIPTION ?? '')
    .version(process.env.APP_VERSION ?? '')
    .hook('preAction', (command, actionCommand) => {
      const allOpts = {
        ...command.optsWithGlobals(),
        ...actionCommand.opts(),
      };
      const skipBanner = allOpts.hideBanner || allOpts.pipe;
      if (!skipBanner) {
        console.log(BANNER);
        console.log(`v${process.env.APP_VERSION} - from ${process.env.APP_AUTHOR} with ${EMOJIS.HEART}\n`);
      }
    })
    .option('-l, --log <logLevel>', 'log level', 'warn')
    .option('--hide-banner', 'hide banner', false);

  const context = new DefaultContext();
  try {
    // log level should be set before loading the context and other commands
    await setupLogLevel(context);
    await context.load();

    // register built-in commands
    await CommandLoader.load(program, context);
    // register commands from plugins
    await context.getPluginManager().callPluginMethod<CommandPlugin>(COMMAND_PLUGIN, 'register', program);

    await program.parseAsync(process.argv);
  } finally {
    await context.unload();
  }

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
};

await bootstrap();
