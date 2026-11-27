import type { CountUnit } from '$lib/utils/formatting/number/countText.ts';

export type ItemCountStatProps = {
  // Blank while it is undefined.
  itemCount?: number;
  wideLabel?: boolean;
  unit?: CountUnit;
};
