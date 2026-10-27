import { describe, expect, it } from 'vitest';
import { toWriteErrorMessage } from './toWriteErrorMessage.ts';

describe('toWriteErrorMessage', () => {
  it.each(
    [
      {
        errorClass: 'rate-limited',
        message: 'Trakt is rate limiting you. Try again shortly.',
      },
      { errorClass: 'limit-reached', message: 'Your list is full.' },
      { errorClass: 'failed', message: "Couldn't save. Try again." },
    ] as const,
  )(
    'should map $errorClass to its message',
    ({ errorClass, message }) => {
      expect(toWriteErrorMessage(errorClass)).toBe(message);
    },
  );

  it('should have no message for an expired Session', () => {
    expect(toWriteErrorMessage('session-expired')).toBeUndefined();
  });
});
