const SPOILER_PAIR = /\[spoiler\].*?\[\/spoiler\]/s;

export function hasSpoilerTag(text: string): boolean {
  return SPOILER_PAIR.test(text);
}
