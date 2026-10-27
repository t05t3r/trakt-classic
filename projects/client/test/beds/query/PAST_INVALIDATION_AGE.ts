import { time } from '$lib/utils/timing/time.ts';

// Past the 30 s within which useQuery's invalidation hook leaves loaded data alone.
export const PAST_INVALIDATION_AGE = time.seconds(31);
