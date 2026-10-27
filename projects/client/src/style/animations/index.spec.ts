import { REDUCED_MOTION } from '$test/beds/css/REDUCED_MOTION.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Vitest's default `css.include: []` empties every `.scss` import, `?raw` too.
const css = readFileSync(join(import.meta.dirname, 'index.scss'), 'utf8');

const durationSpin = (block: string) =>
  block.match(/--animation-duration-spin:\s*([^;]+);/)?.at(1)?.trim();

describe('style: animations', () => {
  it('should spin a full turn', () => {
    expect(css).toMatch(
      /@keyframes spin \{\s*from \{\s*transform: rotate\(0deg\);\s*\}\s*to \{\s*transform: rotate\(360deg\);\s*\}\s*\}/,
    );
  });

  it('should spin in 2s', () => {
    expect(durationSpin(css.replace(REDUCED_MOTION, ''))).toBe('2s');
  });

  it('should stop the spin under reduced motion', () => {
    expect(durationSpin(css.match(REDUCED_MOTION)?.at(1) ?? '')).toBe('0ms');
  });
});
