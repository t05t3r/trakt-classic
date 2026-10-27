export function glyphClasses(
  container: HTMLElement,
): ReadonlyArray<string | null> {
  return [...container.querySelectorAll('svg')].map((svg) =>
    svg.getAttribute('class')
  );
}
