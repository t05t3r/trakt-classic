// The trimmed text of each tag on a fanart card's caption line, in order.
export function captionTags(
  card: Element,
): ReadonlyArray<string | undefined> {
  return [...(card.querySelector('.caption')?.children ?? [])]
    .map((tag) => tag.textContent?.trim());
}
