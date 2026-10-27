import { highest } from './highest.ts';
import { lowest } from './lowest.ts';

type NearestNumberParams = {
  numbers: ReadonlyArray<number>;
  current: number;
  side: 'below' | 'above';
};

export function nearestNumber(
  { numbers, current, side }: NearestNumberParams,
): number | undefined {
  const beyond = numbers.filter((number) =>
    side === 'below' ? number < current : number > current
  );

  return side === 'below' ? highest(beyond) : lowest(beyond);
}
