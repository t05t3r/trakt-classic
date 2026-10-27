import { REDUCED_MOTION } from '$test/beds/css/REDUCED_MOTION.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Vitest's default `css.include: []` empties every `.scss` import, `?raw` too.
const css = readFileSync(join(import.meta.dirname, 'index.scss'), 'utf8');

const declarations = (block: string) =>
  new Map(
    [...block.matchAll(/(--transition-[\w-]+):\s*([^;]+);/g)]
      .map(([, name, value]) => [name, value?.trim()]),
  );

const motion = declarations(css.replace(REDUCED_MOTION, ''));
const reduced = declarations(css.match(REDUCED_MOTION)?.at(1) ?? '');

describe('style: transitions', () => {
  it('should declare the Classic durations beside the inherited ones', () => {
    expect(motion).toEqual(
      new Map([
        ['--transition-increment', '150ms'],
        ['--transition-duration-short', '300ms'],
        ['--transition-default', '500ms'],
        ['--transition-fast', '250ms'],
        ['--transition-instant', '100ms'],
        ['--transition-slow', '1000ms'],
      ]),
    );
  });

  it('should zero every transition token under reduced motion', () => {
    expect(reduced).toEqual(
      new Map([...motion.keys()].map((name) => [name, '0ms'])),
    );
  });
});
