const ARROW_STEPS: ReadonlyMap<string, number> = new Map([
  ['ArrowRight', 1],
  ['ArrowLeft', -1],
]);

type RovingIndexParams = {
  key: string;
  from: number;
  count: number;
  isRtl: boolean;
};

export function toRovingIndex(
  { key, from, count, isRtl }: RovingIndexParams,
): number | undefined {
  if (count <= 0) return undefined;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;

  const step = ARROW_STEPS.get(key);
  if (step === undefined) return undefined;

  const offset = isRtl ? -step : step;
  return (from + offset + count) % count;
}
