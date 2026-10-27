import { browser } from '$app/environment';
import { defer, fromEvent, type Observable, of } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';

class MediaQueryManager {
  private static instance: MediaQueryManager;
  private queries = new Map<string, Observable<boolean>>();

  static getInstance(): MediaQueryManager {
    if (!this.instance) this.instance = new MediaQueryManager();
    return this.instance;
  }

  observe(query: string): Observable<boolean> {
    if (!browser) return of(false);

    const cached = this.queries.get(query);
    if (cached) return cached;

    const mediaQuery = globalThis.matchMedia(query);
    const observer = defer(() =>
      fromEvent<MediaQueryListEvent>(mediaQuery, 'change').pipe(
        map((event) => event.matches),
        startWith(mediaQuery.matches),
      )
    ).pipe(shareReplay(1));
    this.queries.set(query, observer);
    return observer;
  }
}

export function useMedia(query: string): Observable<boolean> {
  return MediaQueryManager.getInstance().observe(query);
}
