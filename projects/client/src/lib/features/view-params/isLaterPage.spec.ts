import { describe, expect, it } from 'vitest';
import { isLaterPage } from './isLaterPage.ts';

describe('util: isLaterPage', () => {
  it.each(['2', '10', '120'])('should take %s as a later page', (value) => {
    expect(isLaterPage(value)).toBe(true);
  });

  it.each([
    { value: '1', reason: 'the first page' },
    { value: '0', reason: 'no page' },
    { value: '', reason: 'an empty value' },
    { value: '02', reason: 'a leading zero' },
    { value: '-2', reason: 'a sign' },
    { value: '2.5', reason: 'a fraction' },
    { value: 'two', reason: 'a word' },
    { value: '9007199254740993', reason: 'a page past the safe integers' },
  ])('should refuse $value, $reason', ({ value }) => {
    expect(isLaterPage(value)).toBe(false);
  });
});
