import { describe, expect, it } from 'vitest';
import { resolveLocaleAction } from './resolveLocaleAction.ts';

const base = {
  isAuthorized: true,
};

describe('util: resolveLocaleAction', () => {
  describe('backfill', () => {
    it('should backfill the active locale when nothing is saved', () => {
      expect(
        resolveLocaleAction({ ...base, saved: undefined, active: 'en' }),
      ).to.deep.equal({ type: 'backfill', value: 'en' });
    });

    it('should not backfill for anonymous users', () => {
      expect(
        resolveLocaleAction({
          ...base,
          isAuthorized: false,
          saved: undefined,
          active: 'en',
        }),
      ).to.deep.equal({ type: 'none' });
    });

    it('should not backfill an unknown active locale', () => {
      expect(
        resolveLocaleAction({ ...base, saved: undefined, active: 'xx-XX' }),
      ).to.deep.equal({ type: 'none' });
    });

    it('should not backfill when a locale is already saved', () => {
      expect(
        resolveLocaleAction({ ...base, saved: 'en', active: 'en' }),
      ).to.deep.equal({ type: 'none' });
    });
  });

  it('should do nothing when saved already matches active', () => {
    expect(
      resolveLocaleAction({ ...base, saved: 'en', active: 'en' }),
    ).to.deep.equal({ type: 'none' });
  });
});
