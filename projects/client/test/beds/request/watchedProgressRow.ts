// A row of `sync/progress/watched`, with only the fields its read maps.
export function watchedProgressRow<T>(
  show: T,
  lastWatchedAt: string | null | undefined,
) {
  return { show, progress: { last_watched_at: lastWatchedAt } };
}
