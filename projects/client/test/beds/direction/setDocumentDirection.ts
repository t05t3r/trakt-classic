import { onTestFinished } from 'vitest';

// Registers the restore first, so a call outside a test throws before the direction changes.
export function setDocumentDirection(dir: string): void {
  const root = document.documentElement;
  const found = root.getAttribute('dir');
  onTestFinished(() => restoreDirection(root, found));
  root.dir = dir;
}

function restoreDirection(root: HTMLElement, found: string | null): void {
  if (found === null) {
    root.removeAttribute('dir');
    return;
  }

  root.setAttribute('dir', found);
}
