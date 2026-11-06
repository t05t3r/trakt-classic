type PickSegmentParams<T extends string> = {
  value: string;
  position: number;
  values: ReadonlyArray<T>;
};

export function pickSegment<T extends string>(
  { value, position, values }: PickSegmentParams<T>,
): T | 'all' {
  const segment = value.split('/').at(position);

  return values.find((each) => each === segment) ?? 'all';
}
