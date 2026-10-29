import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import type { ProgressCount } from '$lib/utils/media/isProgressComplete.ts';
import type { CommentsTarget } from '../stores/useComments.ts';

export type CommentsBlockProps = {
  // Read once, so a new Target needs a new block: the caller keys it.
  target: CommentsTarget;
  // The page's Target, read once like `target`.
  media: QuickActionsTarget;
  // A show's or a season's progress, read as it changes, since it lands after the block.
  progress?: SectionStatus<ProgressCount>;
};
