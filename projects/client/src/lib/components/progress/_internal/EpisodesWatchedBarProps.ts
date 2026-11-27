import type { TickProgressBarProps } from './TickProgressBarProps.ts';

export type EpisodesWatchedBarProps = {
  // Watched of the aired episodes.
  completed: number;
  total: number;
  size: TickProgressBarProps['size'];
  segments?: TickProgressBarProps['segments'];
  highlight?: TickProgressBarProps['highlight'];
};
