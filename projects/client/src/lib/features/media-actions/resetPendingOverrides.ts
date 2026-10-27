import { pendingOverrides } from './_internal/pendingOverrides.ts';

// Pending Overrides are module state, so a test setup clears them between specs.
export function resetPendingOverrides(): void {
  pendingOverrides.reset();
}
