import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { CommentsBlockProps } from '$lib/features/comments/components/CommentsBlockProps.ts';

export type SummaryCommentsProps = CommentsBlockProps & {
  status: SectionStatus<number>;
};
