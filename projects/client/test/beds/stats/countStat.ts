import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { queryCountStat } from './queryCountStat.ts';

export function countStat(label: string): HTMLElement {
  return assertDefined(queryCountStat(label), `No stat labelled ${label}`);
}
