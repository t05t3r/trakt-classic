import { getConfirmationContext } from './_internal/getConfirmationContext.ts';
import type { ConfirmationParams } from './models/ConfirmationParams.ts';

export function useConfirm() {
  const { showConfirmation } = getConfirmationContext();

  const confirmAsync = (params: ConfirmationParams): Promise<boolean> =>
    new Promise((resolve) =>
      showConfirmation({
        ...params,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
    );

  return { confirmAsync };
}
