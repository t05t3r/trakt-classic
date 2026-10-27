import type { ConfirmationParams } from './ConfirmationParams.ts';

export type ConfirmationRequest = ConfirmationParams & {
  onConfirm: () => void;
  onCancel?: () => void;
};
