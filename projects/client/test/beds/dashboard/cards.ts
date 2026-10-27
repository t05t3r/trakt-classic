export function cards(
  region: HTMLElement,
  selector: string,
): ReadonlyArray<HTMLElement> {
  return [...region.querySelectorAll<HTMLElement>(selector)];
}
