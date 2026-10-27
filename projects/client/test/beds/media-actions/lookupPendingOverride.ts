import {
  type PendingOverride,
  type PendingOverrideKey,
  pendingOverrides,
} from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { firstValueFrom } from 'rxjs';

export function lookupPendingOverride(
  key: PendingOverrideKey,
): Promise<PendingOverride | undefined> {
  return firstValueFrom(pendingOverrides.lookup$(key));
}
