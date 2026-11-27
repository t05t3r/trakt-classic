import type { Highlight } from './toRuns.ts';

export type TickProgressBarProps = {
  value: number;
  total: number;
  size: 'sm' | 'lg';
  label: string;
  // One filled flag per tick, drawn in place of the one fill.
  segments?: ReadonlyArray<boolean>;
  // The ticks left bright while every other one dims.
  highlight?: Highlight;
};
