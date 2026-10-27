import { hiddenRecommendations } from './_internal/hiddenRecommendations.ts';

// Hidden recommendations are module state, so a test setup clears them between specs.
export function resetHiddenRecommendations(): void {
  hiddenRecommendations.reset();
}
