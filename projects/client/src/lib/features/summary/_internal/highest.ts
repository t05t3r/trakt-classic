import { isEmpty } from '$lib/utils/array/isEmpty.ts';

export const highest = (numbers: ReadonlyArray<number>): number | undefined =>
  isEmpty(numbers) ? undefined : Math.max(...numbers);
