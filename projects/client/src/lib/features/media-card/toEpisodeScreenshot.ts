import * as m from '$lib/features/i18n/messages.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';

type EpisodeScreenshotParams = {
  show: Pick<ShowEntry, 'title'>;
  episode: EpisodeEntry;
};

export function toEpisodeScreenshot(
  { show, episode }: EpisodeScreenshotParams,
) {
  return {
    src: episode.cover.url.thumb,
    alt: m.image_alt_episode_screenshot({
      show: show.title,
      sxe: episodeSxeLabel(episode),
    }),
  };
}
