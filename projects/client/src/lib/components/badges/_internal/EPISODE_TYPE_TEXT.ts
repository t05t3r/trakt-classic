import * as m from '$lib/features/i18n/messages.ts';
import {
  EpisodeFinaleType,
  EpisodePremiereType,
  type EpisodeType,
} from '$lib/requests/models/EpisodeType.ts';

export const EPISODE_TYPE_TEXT: Readonly<
  Partial<Record<EpisodeType, () => string>>
> = {
  [EpisodePremiereType.series_premiere]: m.tag_text_series_premiere,
  [EpisodePremiereType.season_premiere]: m.tag_text_season_premiere,
  [EpisodePremiereType.mid_season_premiere]: m.tag_text_mid_season_premiere,
  [EpisodeFinaleType.mid_season_finale]: m.tag_text_mid_season_finale,
  [EpisodeFinaleType.season_finale]: m.tag_text_season_finale,
  [EpisodeFinaleType.series_finale]: m.tag_text_series_finale,
};
