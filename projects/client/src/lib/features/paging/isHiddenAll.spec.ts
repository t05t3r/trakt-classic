import { describe, expect, it } from 'vitest';
import { isHiddenAll } from './isHiddenAll.ts';

const ENTRY = { id: 1 };

describe('util: isHiddenAll', () => {
  it('should be true when an empty status keeps entries', () => {
    expect(isHiddenAll({ status: { kind: 'empty' }, entries: [ENTRY] }))
      .toBe(true);
  });

  it('should be false when the page came back with no entries', () => {
    expect(isHiddenAll({ status: { kind: 'empty' }, entries: [] }))
      .toBe(false);
  });

  it('should be false when no entries have landed', () => {
    expect(isHiddenAll({ status: { kind: 'empty' }, entries: undefined }))
      .toBe(false);
  });

  it('should be false when some rows still show', () => {
    expect(isHiddenAll({
      status: { kind: 'ready', data: [] },
      entries: [ENTRY],
    })).toBe(false);
  });
});
