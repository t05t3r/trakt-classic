import { isEmpty } from '$lib/utils/array/isEmpty.ts';

export const lowest = (numbers: ReadonlyArray<number>): number | undefined =>
  isEmpty(numbers) ? undefined : Math.min(...numbers);
