import { TYPE_LABELS } from './TYPE_LABELS.ts';

export function toTypeChoices<T extends keyof typeof TYPE_LABELS>(
  types: ReadonlyArray<T>,
) {
  return types.map((value) => ({ value, label: TYPE_LABELS[value]() }));
}
