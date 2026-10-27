import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';

// Mapped keys already name their kind, so episodes and movies never collide.
export function toLineKey(line: CalendarEntry): string {
  return line.kind === 'episode' ? line.episode.key : line.movie.key;
}
