import { clamp } from '$lib/utils/number/clamp.ts';
import { ratio } from '$lib/utils/number/ratio.ts';

type ClampedShareProps = {
  value: number;
  total: number;
};

// Bounded, so a bar or a pie never draws past full or below empty.
export function clampedShare({ value, total }: ClampedShareProps): number {
  return clamp({ value: ratio({ value, total }), min: 0, max: 1 });
}
