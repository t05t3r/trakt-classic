import * as m from '$lib/features/i18n/messages.ts';
import type { WriteErrorClass } from '../WriteError.ts';

const WRITE_ERROR_MESSAGES: Record<WriteErrorClass, () => string | undefined> =
  {
    'rate-limited': m.error_text_write_rate_limited,
    'limit-reached': m.error_text_write_limit_reached,
    'failed': m.error_text_write_failed,
    'session-expired': () => undefined,
  };

export function toWriteErrorMessage(
  errorClass: WriteErrorClass,
): string | undefined {
  return WRITE_ERROR_MESSAGES[errorClass]();
}
