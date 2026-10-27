import { goto } from '$app/navigation';
import { navigating, page } from '$app/state';
import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
import { isShallowEqual } from '$lib/utils/object/isShallowEqual.ts';
import { distinctUntilChanged, map, type Observable } from 'rxjs';

type ViewParamSpec<K extends string> = Readonly<
  Record<K, { values: ReadonlyArray<string>; fallback: string | null }>
>;

type ViewParamValues<K extends string> = Readonly<Record<K, string | null>>;

type FallbackSpec = Readonly<Record<string, { fallback: string | null }>>;

type ViewParamPatch = Readonly<Record<string, string | null | undefined>>;

type ViewParamUpdate<K extends string> =
  | Partial<Record<K, string | null>>
  | ((values: ViewParamValues<K>) => Partial<Record<K, string | null>>);

function readValues<K extends string>(
  spec: ViewParamSpec<K>,
  url: URL,
): ViewParamValues<K> {
  return Object.fromEntries(
    Object.entries<ViewParamSpec<K>[K]>(spec).map((
      [key, { values, fallback }],
    ) => {
      const value = url.searchParams.get(key);
      return [key, value !== null && values.includes(value) ? value : fallback];
    }),
  ) as ViewParamValues<K>;
}

const REPLACE = { replaceState: true, noScroll: true, keepFocus: true };

// Only the keys a set gave, each fallback as null, so a merge needs no spec.
type ParamWrite = Readonly<Record<string, string | null>>;

// Built when its replace runs, so an updater reads the values earlier sets leave.
type PendingWrite = Readonly<{
  pathname: string;
  writeAt: (url: URL) => ParamWrite;
}>;

// page.url changes only once a replace lands, so sets made meanwhile wait.
let lastReplace: Promise<void> = Promise.resolve();
let pending: PendingWrite | undefined;

function toParamWrite(
  { spec, patch }: { spec: FallbackSpec; patch: ViewParamPatch },
): ParamWrite {
  return Object.fromEntries(
    Object.entries(patch).flatMap(([key, value]) => {
      if (value === undefined) return [];
      return [[key, value === spec[key]?.fallback ? null : value]];
    }),
  );
}

function withWrite({ url, write }: { url: URL; write: ParamWrite }): URL {
  const next = new URL(url);
  Object.entries(write).forEach(([key, value]) => {
    if (value === null) {
      next.searchParams.delete(key);
      return;
    }
    next.searchParams.set(key, value);
  });
  // searchParams escapes a comma, which reads the same left literal.
  next.search = next.searchParams.toString().replaceAll('%2C', ',');
  return next;
}

// A null write removes its key, which searchParams then reads as null.
function holdsWrite({ url, write }: { url: URL; write: ParamWrite }): boolean {
  return Object.entries(write).every(([key, value]) =>
    url.searchParams.get(key) === value
  );
}

function replacePending(): Promise<void> {
  const next = pending;
  pending = undefined;
  if (!next) return Promise.resolve();
  // A late replace would cancel the user's navigation or land on another page.
  if (navigating.type !== null || next.pathname !== page.url.pathname) {
    return Promise.resolve();
  }
  const write = next.writeAt(page.url);
  if (holdsWrite({ url: page.url, write })) {
    return Promise.resolve();
  }

  return goto(withWrite({ url: page.url, write }), REPLACE);
}

function afterWrite(
  first: PendingWrite['writeAt'],
  second: PendingWrite['writeAt'],
): PendingWrite['writeAt'] {
  return (url) => {
    const write = first(url);
    return { ...write, ...second(withWrite({ url, write })) };
  };
}

export function useViewParam<K extends string>(spec: ViewParamSpec<K>): {
  values: Observable<ViewParamValues<K>>;
  set(update: ViewParamUpdate<K>): Promise<void>;
} {
  return {
    values: fromRune(() => page.url).pipe(
      map((url) => readValues(spec, url)),
      distinctUntilChanged(isShallowEqual),
    ),
    set: (update) => {
      const { pathname } = page.url;
      const writeAt = (url: URL) =>
        toParamWrite({
          spec,
          patch: typeof update === 'function'
            ? update(readValues(spec, url))
            : update,
        });
      const waiting = pending;
      pending = {
        pathname,
        writeAt: waiting?.pathname === pathname
          ? afterWrite(waiting.writeAt, writeAt)
          : writeAt,
      };
      // Merged into the waiting write, so a burst costs one replace.
      if (waiting) return lastReplace;

      // Callers fire and forget, so a failed replace settles quietly.
      lastReplace = lastReplace.then(replacePending).catch(() => undefined);
      return lastReplace;
    },
  };
}
