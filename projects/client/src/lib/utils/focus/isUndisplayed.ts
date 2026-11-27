export function isUndisplayed(element: Element | null): boolean {
  if (!element) return false;
  if (getComputedStyle(element).display === 'none') return true;
  return isUndisplayed(element.parentElement);
}
