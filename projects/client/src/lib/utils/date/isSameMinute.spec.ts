import { describe, expect, it } from 'vitest';
import { isSameMinute } from './isSameMinute.ts';

describe('util: isSameMinute', () => {
  it('should match two times within one minute', () => {
    expect(
      isSameMinute(
        new Date('2025-05-18T11:14:37Z'),
        new Date('2025-05-18T11:14:00Z'),
      ),
    ).toBe(true);
  });

  it('should tell apart two times in neighbouring minutes', () => {
    expect(
      isSameMinute(
        new Date('2025-05-18T11:14:59Z'),
        new Date('2025-05-18T11:15:00Z'),
      ),
    ).toBe(false);
  });

  it('should match two missing times', () => {
    expect(isSameMinute(null, undefined)).toBe(true);
  });

  it('should tell a time apart from a missing one', () => {
    expect(isSameMinute(new Date('2025-05-18T11:14:00Z'), null)).toBe(false);
    expect(isSameMinute(null, new Date('2025-05-18T11:14:00Z'))).toBe(false);
  });
});
