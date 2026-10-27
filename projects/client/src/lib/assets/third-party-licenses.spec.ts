import tablerLicense from '/node_modules/@tabler/icons-svelte/LICENSE?raw';
import notice from '$static/third-party-licenses.txt?raw';
import { describe, expect, it } from 'vitest';

describe('asset: third-party-licenses.txt', () => {
  it('should carry a BOM, then the installed Tabler Icons licence verbatim under its heading', () => {
    expect(notice).toBe(
      `\uFEFFTabler Icons — https://tabler.io/icons\n\n${tablerLicense}`,
    );
  });
});
