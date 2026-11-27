export function ariaLabelsOf(
  elements: Iterable<Element>,
): ReadonlyArray<string | null> {
  return Array.from(elements, (element) => element.getAttribute('aria-label'));
}
