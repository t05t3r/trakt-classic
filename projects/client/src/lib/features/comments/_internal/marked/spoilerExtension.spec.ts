import { Marked, type Token } from 'marked';
import { describe, expect, it } from 'vitest';
import { spoilerExtension } from './spoilerExtension.ts';

const marked = new Marked({ extensions: [spoilerExtension()] });

function types(tokens: Token[]): string[] {
  return tokens.map(({ type }) => type);
}

function inlineTokens(markdown: string): Token[] {
  const block = marked.lexer(markdown).at(0);
  if (!block || !('tokens' in block)) return [];
  return block.tokens ?? [];
}

describe('spoilerExtension', () => {
  it('should match the start of a spoiler tag', () => {
    const tokens = inlineTokens('before [spoiler]hidden[/spoiler] after');

    expect(types(tokens)).toEqual(['text', 'spoiler', 'text']);
  });

  it('should match a spoiler tag', () => {
    const tokens = inlineTokens('[spoiler]test[/spoiler]');

    expect(tokens).toEqual([
      expect.objectContaining({
        type: 'spoiler',
        raw: '[spoiler]test[/spoiler]',
        text: 'test',
      }),
    ]);
  });

  it('should not match another tag', () => {
    const tokens = inlineTokens('[bold]test[/bold]');

    expect(types(tokens)).not.toContain('spoiler');
  });

  it('should match a multiline spoiler tag', () => {
    const content = 'line 1\nline 2';
    const tokens = inlineTokens(`[spoiler]${content}[/spoiler]`);

    expect(tokens).toEqual([
      expect.objectContaining({ type: 'spoiler', text: content }),
    ]);
  });

  it('should lex the markdown inside a spoiler tag', () => {
    const tokens = inlineTokens('[spoiler]a *twist*[/spoiler]');

    expect(tokens).toEqual([
      expect.objectContaining({
        type: 'spoiler',
        tokens: [
          expect.objectContaining({ type: 'text', text: 'a ' }),
          expect.objectContaining({ type: 'em', text: 'twist' }),
        ],
      }),
    ]);
  });

  it('should add no renderer', () => {
    expect(spoilerExtension()).not.toHaveProperty('renderer');
  });
});
