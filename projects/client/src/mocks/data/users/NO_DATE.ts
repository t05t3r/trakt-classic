import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';

// The mappers read a missing date as MAX_DATE.
export const NO_DATE = { airDate: MAX_DATE, effectiveReleaseDate: MAX_DATE };
