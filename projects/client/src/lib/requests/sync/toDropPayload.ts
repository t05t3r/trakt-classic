import type { HiddenMediaRequest } from '@trakt/api';
import { toBulkPayload } from './toBulkPayload.ts';

export type DropPayload = HiddenMediaRequest & {
  shows: Array<{ ids: { trakt: number }; hidden_at: string }>;
};

export function toDropPayload(id: number, at: Date): DropPayload {
  const { shows } = toBulkPayload('show', [id]);
  const hiddenAt = at.toISOString();

  return { shows: shows.map((show) => ({ ...show, hidden_at: hiddenAt })) };
}
