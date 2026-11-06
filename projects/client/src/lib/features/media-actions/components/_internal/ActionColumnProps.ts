import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import type { QuickActionsTarget } from '../QuickActionsProps.ts';

export type ActionColumnProps = {
  // The stores read it once, when the column is made: a new Target needs a new column.
  target: QuickActionsTarget;
  // A show's progress, or a season's `seasons[]` entry: the history button stays inert while it loads, reads its percent and counts once ready, and reads the plays when it is empty, failed or not given.
  progress?: SectionStatus<Pick<ShowProgressDetail, 'completed' | 'total'>>;
  // Off by default; read once, like `target`.
  favorite?: boolean;
};
