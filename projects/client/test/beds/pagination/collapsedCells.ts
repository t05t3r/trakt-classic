export function collapsedCells(region: HTMLElement): NodeListOf<Element> {
  return region.querySelectorAll('.row-reveal-cell.is-collapsed');
}
