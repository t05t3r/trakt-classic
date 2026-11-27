import type { SeasonProgress } from '$lib/requests/models/ShowProgressDetail.ts';
import type { PercentageBarProps } from './PercentageBarProps.ts';

export type SeasonRegionsProps = {
  seasons: ReadonlyArray<SeasonProgress>;
  // The row's next episode, whose season's tooltip is tagged with it.
  nextEpisode: { season: number; number: number } | Nil;
  // The bar's ticks of the season hovered, bound so the bar dims the others.
  highlight?: PercentageBarProps['highlight'];
};
