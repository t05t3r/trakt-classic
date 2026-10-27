import { NEGATIVE_CLAIM_WINDOW } from '$test/beds/promise/NEGATIVE_CLAIM_WINDOW.ts';

export function waitNegativeClaim(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, NEGATIVE_CLAIM_WINDOW));
}
