export function imageHrefs(
  container: HTMLElement,
): ReadonlyArray<string | null> {
  return [...container.querySelectorAll('image')].map((image) =>
    image.getAttribute('href')
  );
}
