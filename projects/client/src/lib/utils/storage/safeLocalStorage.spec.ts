import { describe, expect, it, vi } from 'vitest';

describe('safeLocalStorage', () => {
  it('should return a working storage when localStorage is available', async () => {
    vi.resetModules();
    vi.doMock('$app/environment', () => ({ browser: true }));

    const { safeLocalStorage } = await import('./safeLocalStorage.ts');

    safeLocalStorage.setItem('test-key', 'test-value');
    expect(safeLocalStorage.getItem('test-key')).toBe('test-value');
    safeLocalStorage.removeItem('test-key');
  });

  it('should fall back to a noop storage when accessing localStorage throws', async () => {
    vi.resetModules();
    vi.doMock('$app/environment', () => ({ browser: true }));

    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'localStorage',
    );
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError: localStorage is blocked');
      },
    });

    const { safeLocalStorage } = await import('./safeLocalStorage.ts');

    expect(safeLocalStorage.getItem('test-key')).toBeNull();
    expect(() => safeLocalStorage.setItem('test-key', 'x')).not.toThrow();

    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
    }
  });

  it('should fall back to a noop storage when localStorage is null', async () => {
    vi.resetModules();
    vi.doMock('$app/environment', () => ({ browser: true }));

    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'localStorage',
    );
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: null,
      writable: true,
    });

    const { safeLocalStorage } = await import('./safeLocalStorage.ts');

    expect(safeLocalStorage.getItem('test-key')).toBeNull();

    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
    }
  });

  it('should return a noop storage in non-browser environments', async () => {
    vi.resetModules();
    vi.doMock('$app/environment', () => ({ browser: false }));

    const { safeLocalStorage } = await import('./safeLocalStorage.ts');

    expect(safeLocalStorage.getItem('any')).toBeNull();
    safeLocalStorage.setItem('any', 'value');
    expect(safeLocalStorage.getItem('any')).toBeNull();
  });
});
