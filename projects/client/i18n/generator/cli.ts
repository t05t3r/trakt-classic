/**
 * CLI script to generate platform-specific i18n resources from meta files
 */

import { generateFromMeta } from './core/generateFromMeta.ts';
import { Platform } from './model/Platform.ts';
import { checkCliArgs } from './utils/checkCliArgs.ts';
import { showUsage } from './utils/showUsage.ts';

async function generateFiles(
  input: string,
  outputDir: string,
  platforms?: Platform[],
) {
  const results = await generateFromMeta(input, outputDir, platforms);

  console.log('\n✅ Generation completed successfully!');
  console.log(`Generated ${results.length} resource file(s):`);
  for (const result of results) {
    console.log(`  ${result.platform}: ${result.filePath}`);
  }
}

async function watchFiles(
  input: string,
  outputDir: string,
  platforms?: Platform[],
) {
  console.log(`👀 Watching ${input} for changes...`);
  console.log(
    `🎯 Platforms: ${platforms?.length ? platforms.join(', ') : 'all enabled'}`,
  );
  console.log('Press Ctrl+C to stop watching\n');

  // Initial generation
  await generateFiles(input, outputDir, platforms);

  const watcher = Deno.watchFs([input]);

  for await (const event of watcher) {
    if (event.kind === 'modify' || event.kind === 'create') {
      // Only react to .json files
      const hasJsonFiles = event.paths.some((path) => path.endsWith('.json'));
      if (hasJsonFiles) {
        console.log(`\n🔄 Files changed: ${event.paths.join(', ')}`);
        console.log('🚀 Regenerating...');

        try {
          await generateFiles(input, outputDir, platforms);
        } catch (error) {
          console.error('❌ Generation failed:', error);
        }
      }
    }
  }
}

async function main() {
  const args = await checkCliArgs(Deno.args);

  if (args.help) {
    showUsage();
    return;
  }

  const { input } = args;
  const outputDir = args.output ??
    './.output/generated';
  let platforms: Platform[] | undefined;

  // Parse platforms
  if (args.platforms) {
    const platformStrings = args.platforms.split(',').map((p) => p.trim());
    platforms = [];

    for (const platformStr of platformStrings) {
      if (Object.values(Platform).includes(platformStr as Platform)) {
        platforms.push(platformStr as Platform);
      } else {
        console.error(`❌ Invalid platform: ${platformStr}`);
        console.error(`Valid platforms: ${Object.values(Platform).join(', ')}`);
        throw new Error(`Invalid platform: ${platformStr}`);
      }
    }
  }

  try {
    if (args.watch) {
      await watchFiles(input, outputDir, platforms);
    } else {
      await generateFiles(input, outputDir, platforms);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  Deno.exit(1);
});
