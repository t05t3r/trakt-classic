import { goto } from '$app/navigation';
import { landNavigations } from '$test/beds/url/landNavigations.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

// The route hands on the segments after `base`, a frame after each push, before goto resolves.
export function followPushes(base: `/${string}`, path: string = base) {
  openAt(path);
  const segments = () => window.location.pathname.slice(base.length + 1);
  const route = new BehaviorSubject(segments());
  landNavigations({
    isFrameLater: true,
    onLanded: () => route.next(segments()),
  });

  return {
    route: route.asObservable(),
    pushes: () => vi.mocked(goto).mock.calls.map(([url]) => String(url)),
  };
}
