import { episodeSxeLabel } from './episodeSxeLabel.ts';

export function episodeLabel(
  { season, number, title }: { season: number; number: number; title?: string },
): string {
  return [episodeSxeLabel({ season, number }), title].filter(Boolean).join(' ');
}
