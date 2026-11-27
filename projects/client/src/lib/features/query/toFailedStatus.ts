import type {
  FailedStatus,
  SectionStatus,
} from '$lib/components/feedback/SectionStatus.ts';

function isFailed(status: SectionStatus<unknown>): status is FailedStatus {
  return status.kind === 'error';
}

export function toFailedStatus(
  statuses: ReadonlyArray<SectionStatus<unknown>>,
): FailedStatus | undefined {
  const failed = statuses.filter(isFailed);
  if (failed.length === 0) return undefined;

  return {
    kind: 'error',
    retry: () => failed.forEach(({ retry }) => retry()),
  };
}
