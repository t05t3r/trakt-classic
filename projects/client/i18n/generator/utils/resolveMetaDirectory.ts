import * as fs from 'node:fs';
import * as path from 'node:path';

export async function resolveMetaDirectory(input: string): Promise<string> {
  const inputPath = path.resolve(input);
  const stat = await fs.promises.stat(inputPath);

  if (!stat.isDirectory()) {
    throw new Error('Input must be a directory containing meta files');
  }

  return inputPath;
}
