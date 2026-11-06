export function controlledBy(control: Element): HTMLElement | null {
  return document.getElementById(control.getAttribute('aria-controls') ?? '');
}
