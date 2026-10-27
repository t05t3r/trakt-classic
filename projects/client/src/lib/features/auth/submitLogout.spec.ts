import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitLogout } from './submitLogout.ts';

describe('submitLogout', () => {
  afterEach(() => {
    document.querySelector('form')?.remove();
    vi.restoreAllMocks();
  });

  it('should submit a full-navigation logout form', () => {
    const submit = vi
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => {});

    submitLogout();

    const form = document.querySelector('form');
    expect(form?.action).toBe(
      new URL('/auth/logout', globalThis.location.origin).href,
    );
    expect(form?.method).toBe('post');
    expect(submit).toHaveBeenCalledOnce();
  });
});
