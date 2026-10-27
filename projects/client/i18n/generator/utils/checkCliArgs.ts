import { parseArgs } from 'node:util';
import { resolveMetaDirectory } from './resolveMetaDirectory.ts';
import { showUsage } from './showUsage.ts';

export type CliArgs =
  | { readonly help: true }
  | {
    readonly help: false;
    readonly input: string;
    readonly output?: string;
    readonly platforms?: string;
    readonly watch: boolean;
  };

function failWithUsage(message: string): never {
  console.error(`❌ Error: ${message}`);
  showUsage();
  throw new Error(message);
}

function parseCliArgs(argv: ReadonlyArray<string>) {
  try {
    return parseArgs({
      args: [...argv],
      options: {
        input: { type: 'string', short: 'i' },
        output: { type: 'string', short: 'o' },
        platforms: { type: 'string', short: 'p' },
        watch: { type: 'boolean', short: 'w' },
        help: { type: 'boolean', short: 'h' },
      },
      strict: true,
      allowPositionals: false,
    }).values;
  } catch (error) {
    return failWithUsage(
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function checkCliArgs(
  argv: ReadonlyArray<string>,
): Promise<CliArgs> {
  const args = parseCliArgs(argv);

  if (args.help) {
    return { help: true };
  }

  if (!args.input) {
    failWithUsage('Input directory is required');
  }

  await resolveMetaDirectory(args.input).catch((error: unknown) =>
    failWithUsage(error instanceof Error ? error.message : String(error))
  );

  return {
    help: false,
    input: args.input,
    output: args.output,
    platforms: args.platforms,
    watch: args.watch ?? false,
  };
}
