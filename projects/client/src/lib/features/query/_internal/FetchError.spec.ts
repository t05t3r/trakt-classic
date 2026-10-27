import { describe, expect, it } from 'vitest';
import { FetchError } from './FetchError.ts';

describe('FetchError', () => {
  it('should expose the first failed status of several responses', () => {
    const error = new FetchError(
      [{ status: 200 }, { status: 404 }, { status: 500 }],
      'Failed to fetch data: several',
    );

    expect(error.detail).toStrictEqual({ status: 404 });
  });

  it('should expose a 2xx status that a query does not expect', () => {
    const error = new FetchError(
      [{ status: 200 }, { status: 202 }],
      'Failed to fetch data: accepted',
    );

    expect(error.detail).toStrictEqual({ status: 202 });
  });

  it('should expose the status of a single failed response', () => {
    const error = new FetchError(
      { status: 404 },
      'Failed to fetch data: not found',
    );

    expect(error.detail).toStrictEqual({ status: 404 });
  });
});
