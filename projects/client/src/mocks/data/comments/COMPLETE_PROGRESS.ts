import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { ProgressCount } from '$lib/utils/media/isProgressComplete.ts';

export const COMPLETE_PROGRESS = {
  kind: 'ready',
  data: { completed: 17, total: 17 },
} as const satisfies SectionStatus<ProgressCount>;
