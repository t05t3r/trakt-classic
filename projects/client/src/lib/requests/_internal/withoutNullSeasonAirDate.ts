import { z } from 'zod';

// Trakt sends a season it has no date for as `null`, which the SDK refuses.
const NullAiredSeasonRowSchema = z.object({
  season: z.object({ first_aired: z.null() }).passthrough(),
}).passthrough();

export function withoutNullSeasonAirDate(row: unknown): unknown {
  const parsed = NullAiredSeasonRowSchema.safeParse(row);
  if (!parsed.success) return row;

  const { season } = parsed.data;
  return { ...parsed.data, season: { ...season, first_aired: undefined } };
}
