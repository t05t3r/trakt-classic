import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { CastGroup } from '$lib/features/summary/_internal/CastGroup.ts';

export type CastBlockProps = {
  status: SectionStatus<ReadonlyArray<CastGroup>>;
};
