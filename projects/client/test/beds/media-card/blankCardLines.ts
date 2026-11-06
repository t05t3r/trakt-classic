export function blankCardLines(
  container: HTMLElement,
): NodeListOf<Element> {
  return container.querySelectorAll('.card-subtitle[aria-hidden="true"]');
}
