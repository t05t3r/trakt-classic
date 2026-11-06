import { getConfirmationContext } from './_internal/getConfirmationContext.ts';
import type { ConfirmationParams } from './models/ConfirmationParams.ts';

export function useConfirm() {
  const { showConfirmation } = getConfirmationContext();

  // Resolves false for a cancel or a refused request; only a second action reads 'alternate'.
  const confirmAsync = (
    params: ConfirmationParams,
  ): Promise<boolean | 'alternate'> =>
    new Promise((resolve) =>
      showConfirmation({
        ...params,
        onConfirm: () => resolve(true),
        onAlternate: () => resolve('alternate'),
        onCancel: () => resolve(false),
      })
    );

  return { confirmAsync };
}
