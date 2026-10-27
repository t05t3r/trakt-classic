import { useToasts } from '$lib/features/action-toast/stores/useToasts.ts';
import { WriteError } from '../WriteError.ts';
import { toWriteErrorMessage } from './toWriteErrorMessage.ts';

export function notifyWriteFailure(error: unknown): void {
  if (!(error instanceof WriteError)) throw error;

  const message = toWriteErrorMessage(error.class);
  if (message) useToasts().notify(message);
}
