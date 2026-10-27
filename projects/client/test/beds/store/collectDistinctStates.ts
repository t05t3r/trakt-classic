import { distinctUntilChanged, type Observable, Subscription } from 'rxjs';
import { onTestFinished } from 'vitest';

// Records the first value too, so a leading `undefined` is never lost.
export function collectDistinctStates<T>(
  source: Observable<T>,
): ReadonlyArray<T> {
  const states: T[] = [];
  // Registers the unsubscribe first, so a call outside a test throws before it subscribes.
  const subscription = new Subscription();
  onTestFinished(() => subscription.unsubscribe());

  subscription.add(
    source.pipe(distinctUntilChanged()).subscribe((value) =>
      states.push(value)
    ),
  );

  return states;
}
