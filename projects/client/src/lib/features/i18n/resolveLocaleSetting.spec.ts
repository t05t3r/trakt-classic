import { describe, expect, it } from 'vitest';
import { resolveLocaleSetting } from './resolveLocaleSetting.ts';

describe('util: resolveLocaleSetting', () => {
  it('should return null when nothing is saved', () => {
    expect(resolveLocaleSetting({ saved: null, active: 'en-us' }))
      .to.equal(null);
    expect(resolveLocaleSetting({ saved: undefined, active: 'en-us' }))
      .to.equal(null);
    expect(resolveLocaleSetting({ saved: '', active: 'en-us' }))
      .to.equal(null);
  });

  it('should return null when the saved locale is not available', () => {
    expect(resolveLocaleSetting({ saved: 'xx-XX', active: 'en-us' }))
      .to.equal(null);
  });

  it('should return null when the saved locale already matches', () => {
    expect(resolveLocaleSetting({ saved: 'en', active: 'en' }))
      .to.equal(null);
  });
});
