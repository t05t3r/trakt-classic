import { clamp } from '$lib/utils/number/clamp.ts';
import { ratio } from '$lib/utils/number/ratio.ts';

type FlooredPercentProps = {
  value: number;
  total: number;
};

// Scaled before dividing, since 0.29 * 100 floors to 28.
// Bounded, so a label never reads past 100% beside a bar that cannot.
export function flooredPercent({ value, total }: FlooredPercentProps): number {
  return clamp({
    value: Math.floor(ratio({ value: value * 100, total })),
    min: 0,
    max: 100,
  });
}
