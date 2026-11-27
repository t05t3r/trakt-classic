import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';
import { flooredPercent } from '$lib/utils/number/flooredPercent.ts';

type FlooredPercentageProps = {
  value: number;
  total: number;
};

// Classic floors a share: 545 of 783 reads 69%, not 70%.
export function toFlooredPercentage(
  { value, total }: FlooredPercentageProps,
  locale = 'en',
): string {
  return toPercentage(flooredPercent({ value, total }) / 100, locale);
}
