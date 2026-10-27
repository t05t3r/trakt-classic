import { describe, expect, it } from 'vitest';
import { notifyWriteFailure } from './notifyWriteFailure.ts';

describe('notifyWriteFailure', () => {
  it('should rethrow an error that is not a write error', () => {
    const error = new TypeError('x');

    expect(() => notifyWriteFailure(error)).toThrow(error);
  });
});
