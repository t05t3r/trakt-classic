import { setDocumentDirection } from '$test/beds/direction/setDocumentDirection.ts';
import { describe, expect, it, vi } from 'vitest';
import { getDocumentDirection } from './getDocumentDirection.ts';

describe('util: getDocumentDirection', () => {
  it('should read a document without a direction as left to right', () => {
    expect(getDocumentDirection()).toBe('ltr');
  });

  it.each(['ltr', 'rtl'])('should read a document set to %s', (dir) => {
    setDocumentDirection(dir);

    expect(getDocumentDirection()).toBe(dir);
  });

  it('should read any other direction as left to right', () => {
    setDocumentDirection('auto');

    expect(getDocumentDirection()).toBe('ltr');
  });

  it('should read left to right where there is no document', () => {
    // Restored before the shared after-each hooks, which read the document.
    vi.stubGlobal('document', undefined);
    const direction = getDocumentDirection();
    vi.unstubAllGlobals();

    expect(direction).toBe('ltr');
  });
});
