import type { TokenizerExtension } from 'marked';

function matchSpoilerTagStart(src: string) {
  return src.match(/\[spoiler\]/)?.index;
}

function matchSpoilerTag(src: string) {
  const rule = /^\[spoiler\](.*?)\[\/spoiler\]/s;
  return rule.exec(src);
}

export function spoilerExtension(): TokenizerExtension {
  return {
    name: 'spoiler',
    level: 'inline',
    start(src: string) {
      return matchSpoilerTagStart(src);
    },
    tokenizer(src) {
      const match = matchSpoilerTag(src);
      if (match) {
        const token = {
          type: 'spoiler',
          raw: match[0],
          text: match[1]?.trim() ?? '',
          tokens: [],
        };
        this.lexer.inline(token.text, token.tokens);
        return token;
      }

      return undefined;
    },
  };
}
