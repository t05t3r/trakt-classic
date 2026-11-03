import { goto } from '$app/navigation';
import { expect } from 'vitest';

export function expectOneReplace() {
  expect(goto).toHaveBeenCalledExactlyOnceWith(
    expect.any(URL),
    expect.objectContaining({ replaceState: true }),
  );
}
