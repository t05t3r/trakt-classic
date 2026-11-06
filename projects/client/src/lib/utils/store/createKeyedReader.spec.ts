import { collectStates } from '$test/beds/store/collectStates.ts';
import { BehaviorSubject, EMPTY, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { createKeyedReader } from './createKeyedReader.ts';

type Source = { reading: BehaviorSubject<string> };

describe('util: createKeyedReader', () => {
  it('should read through the initial value at once', () => {
    const { reading } = createKeyedReader({
      initial: of('Ready'),
      read: (current) => current,
    });

    expect(collectStates(reading)).toEqual(['Ready']);
  });

  it('should read nothing while the initial value has no reading', () => {
    const { reading } = createKeyedReader<Source | undefined, string>({
      initial: undefined,
      read: (current) => current?.reading ?? EMPTY,
    });

    expect(collectStates(reading)).toEqual([]);
  });

  it('should read through the latest value and drop the reading before it', () => {
    const first = { reading: new BehaviorSubject('Reading a') };
    const second = { reading: new BehaviorSubject('Reading b') };
    const { latest, reading } = createKeyedReader<Source | undefined, string>({
      initial: undefined,
      read: (current) => current?.reading ?? EMPTY,
    });
    const seen = collectStates(reading);

    latest.next(first);
    latest.next(second);
    first.reading.next('Late a');
    second.reading.next('Later b');

    expect(seen).toEqual(['Reading a', 'Reading b', 'Later b']);
    expect(first.reading.observed).toBe(false);
  });
});
