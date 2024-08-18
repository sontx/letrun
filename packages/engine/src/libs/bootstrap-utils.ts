import { AppContext } from '@letrun/core';
import { DEFAULT_LOGGER } from '@src/libs/log-helper';

export async function setGlobalLogLevel(context: AppContext, logLevel: string) {
  DEFAULT_LOGGER.setLevel(logLevel);
  await context.getConfigProvider().set('logger.level', logLevel);
}

// a helper function to get the value of an option from the command line arguments
// use don't use the commander here because this happens before the commander is loaded
export function getOptionValue(shortOption: string, longOption: string) {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === shortOption || args[i] === longOption) {
      // If the option is found without "=", return the next argument as the value
      return i + 1 < args.length ? args[i + 1] : null;
    } else if (args[i]?.startsWith(shortOption + '=') || args[i]?.startsWith(longOption + '=')) {
      // If the option is found with "=", split and return the value
      return args[i]?.split('=')?.[1];
    }
  }

  // Return null if the option is not specified or has no value
  return null;
}
