// a helper function to get the value of an option from the command line arguments
// use don't use the commander here because this happens before the commander is loaded
export function getOptionValue(shortOption: string, longOption: string) {
  const args = process.argv.slice(2);
  // Find the index of the short option or the long option in the arguments array
  const optionIndex = args.indexOf(shortOption) !== -1 ? args.indexOf(shortOption) : args.indexOf(longOption);

  // Check if the option is specified and return its value
  if (optionIndex !== -1 && optionIndex + 1 < args.length) {
    return args[optionIndex + 1];
  }

  // Return null if the option is not specified or has no value
  return null;
}
