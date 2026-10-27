import { describe, expect, it, vi } from 'vitest';

async function loadToken({ browser }: { browser: boolean }) {
  vi.resetModules();
  vi.doMock('$app/environment', () => ({ browser }));

  return await import('./token.ts');
}

describe('token', () => {
  describe('in the browser', () => {
    it('should return the token that was set', async () => {
      const { getToken, setToken } = await loadToken({ browser: true });

      setToken({ value: 'x' });

      expect(getToken().value).toBe('x');
    });

    it('should clear the token when set to null', async () => {
      const { getToken, setToken } = await loadToken({ browser: true });

      setToken({ value: 'x' });
      setToken(null);

      expect(getToken().value).toBeNull();
    });
  });

  describe('on the server', () => {
    it('should ignore a token that was set', async () => {
      const { getToken, setToken } = await loadToken({ browser: false });

      setToken({ value: 'x' });

      expect(getToken().value).toBeNull();
    });
  });
});
