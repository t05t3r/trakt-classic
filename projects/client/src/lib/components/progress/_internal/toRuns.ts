export type Run = {
  isFilled: boolean;
  isDimmed: boolean;
  start: number;
  length: number;
};

export type Highlight = {
  start: number;
  length: number;
};

export function toRuns(
  segments: ReadonlyArray<boolean>,
  highlight?: Highlight,
): ReadonlyArray<Run> {
  const isDimmed = (index: number) =>
    highlight !== undefined &&
    (index < highlight.start || index >= highlight.start + highlight.length);
  const isHead = (index: number) =>
    index === 0 ||
    segments.at(index - 1) !== segments.at(index) ||
    isDimmed(index - 1) !== isDimmed(index);

  const heads = segments.flatMap((isFilled, index) =>
    isHead(index) ? [{ isFilled, isDimmed: isDimmed(index), start: index }] : []
  );

  return heads.map((head, index) => ({
    ...head,
    length: (heads.at(index + 1)?.start ?? segments.length) - head.start,
  }));
}
