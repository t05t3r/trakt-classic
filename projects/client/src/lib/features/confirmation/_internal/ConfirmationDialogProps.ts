import type { Confirmation } from '../models/Confirmation.ts';

export type ConfirmationDialogProps = Confirmation & {
  onConfirm: () => void;
  onAlternate: () => void;
  onCancel: () => void;
};
