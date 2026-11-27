import type { CountStatProps } from '$lib/components/stats/CountStatProps.ts';
import type { ProgressCount } from '$lib/utils/media/isProgressComplete.ts';

export type TimeLeftStatProps = ProgressCount & {
  minutes: number;
  swap?: boolean;
  hint?: CountStatProps['hint'];
};
