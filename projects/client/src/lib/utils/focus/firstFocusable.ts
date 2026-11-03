const CONTROLS = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function firstFocusable(container: ParentNode): HTMLElement | undefined {
  return container.querySelector<HTMLElement>(CONTROLS) ?? undefined;
}
