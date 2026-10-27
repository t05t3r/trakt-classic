import type { RequestEvent } from '@sveltejs/kit';
import { type Mock, vi } from 'vitest';

type Nil = null | undefined;

class InMemoryCookies {
  private store: Map<string, string> = new Map();

  getAll() {
    return Array.from(this.store.entries())
      .map(([name, value]) => ({
        name,
        value,
      }));
  }

  get(name: string): string | null {
    return this.store.get(name) ?? null;
  }

  set(name: string, value: string, _options: Record<string, unknown>): void {
    this.store.set(name, value);
  }

  delete(name: string): void {
    this.store.delete(name);
  }

  serialize(
    name: string,
    value: string,
    options?: Record<string, unknown>,
  ): string {
    const optionsStr = options
      ? Object.entries(options)
        .map(([key, val]) => `;${key}=${val}`)
        .join('')
      : '';
    return `${name}=${value}${optionsStr}`;
  }
}

// The URL properties whose read makes SvelteKit re-run a load on navigation.
const TRACKED_URL_PROPERTIES = [
  'href',
  'pathname',
  'search',
  'searchParams',
  'toString',
  'toJSON',
] as const;

function trackUrlReads(
  { url, isTracking, reads }: {
    url: URL;
    isTracking: () => boolean;
    reads: Array<string>;
  },
): URL {
  const tracked = new URL(url);
  TRACKED_URL_PROPERTIES.forEach((property) => {
    Object.defineProperty(tracked, property, {
      get() {
        if (isTracking()) reads.push(property);
        const value = url[property];
        return typeof value === 'function' ? value.bind(url) : value;
      },
    });
  });
  return tracked;
}

type MockFunction<T> = T & Mock;
export type MockRequestEvent<
  T extends Record<string, string> = Record<string, string>,
> = Exclude<RequestEvent<T>, 'cookies'> & {
  cookies: {
    get: MockFunction<(name: string) => string | null>;
    set: MockFunction<
      (name: string, value: string, options: Record<string, unknown>) => string
    >;
    serialize: MockFunction<
      (name: string, value: string, options: Record<string, unknown>) => string
    >;
  };
  untrack: <R>(fn: () => R) => R;
  // Each tracked URL property read outside `untrack`, in order.
  trackedUrlReads: ReadonlyArray<string>;
};

type RequestEventProps = {
  url: string;
  request?: Request;
  cookieHandler?: (key: string) => string | Nil;
  locals?: Partial<App.Locals>;
};

export function mockRequestEvent({
  url,
  request = new Request('http://localhost'),
  cookieHandler,
  locals = {},
}: RequestEventProps): MockRequestEvent {
  const cookies = new InMemoryCookies();
  const trackedUrlReads: Array<string> = [];
  let isTracking = true;

  return {
    url: trackUrlReads({
      url: new URL(url),
      isTracking: () => isTracking,
      reads: trackedUrlReads,
    }),
    untrack: <R>(fn: () => R): R => {
      isTracking = false;
      try {
        return fn();
      } finally {
        isTracking = true;
      }
    },
    trackedUrlReads,
    cookies: {
      getAll: vi.fn(function () {
        return cookies.getAll();
      }),
      get: vi.fn(function (name: string) {
        return cookieHandler?.(name) ?? cookies.get(name);
      }),
      set: vi.fn(function (
        name: string,
        value: string,
        options: Record<string, unknown>,
      ) {
        return cookies.set(name, value, options);
      }),
      delete: vi.fn(function (name: string) {
        return cookies.delete(name);
      }),
      serialize: vi.fn(function (
        name: string,
        value: string,
        options: Record<string, unknown>,
      ) {
        return cookies.serialize(name, value, options);
      }),
    },
    locals: { ...locals },
    setHeaders: vi.fn(),
    request,
    fetch: globalThis.fetch,
  } as unknown as MockRequestEvent;
}
