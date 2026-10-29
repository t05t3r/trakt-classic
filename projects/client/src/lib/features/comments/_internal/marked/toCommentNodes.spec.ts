import { commentResponse } from '$test/beds/request/commentResponse.ts';
import { describe, expect, it } from 'vitest';
import { toCommentNodes } from './toCommentNodes.ts';

function bodyOf(variant: 'markdown' | 'xss'): string {
  return commentResponse({ id: 1, variant }).comment;
}

describe('toCommentNodes', () => {
  it('should keep strong, emphasis, links, lists and inline spoilers', () => {
    expect(toCommentNodes(bodyOf('markdown'))).toEqual([
      {
        kind: 'paragraph',
        children: [
          { kind: 'strong', children: [{ kind: 'text', text: 'Strong' }] },
          { kind: 'text', text: ', ' },
          { kind: 'emphasis', children: [{ kind: 'text', text: 'emphasis' }] },
          { kind: 'text', text: ' and a ' },
          {
            kind: 'link',
            href: 'https://trakt.tv',
            children: [{ kind: 'text', text: 'link' }],
          },
          { kind: 'text', text: '.' },
        ],
      },
      {
        kind: 'list',
        ordered: false,
        children: [
          { kind: 'listItem', children: [{ kind: 'text', text: 'first' }] },
          { kind: 'listItem', children: [{ kind: 'text', text: 'second' }] },
        ],
      },
      {
        kind: 'paragraph',
        children: [
          { kind: 'text', text: 'An inline ' },
          {
            kind: 'spoiler',
            children: [{ kind: 'text', text: 'hidden ending' }],
          },
          { kind: 'text', text: ' in a line.' },
        ],
      },
    ]);
  });

  it('should mark an ordered list', () => {
    expect(toCommentNodes('1. first\n2. second')).toEqual([
      expect.objectContaining({ kind: 'list', ordered: true }),
    ]);
  });

  it('should break a line at a single newline', () => {
    expect(toCommentNodes('one\ntwo')).toEqual([
      {
        kind: 'paragraph',
        children: [
          { kind: 'text', text: 'one' },
          { kind: 'break' },
          { kind: 'text', text: 'two' },
        ],
      },
    ]);
  });

  it('should render a heading as a bold paragraph', () => {
    expect(toCommentNodes('# A *big* title')).toEqual([
      {
        kind: 'paragraph',
        children: [
          {
            kind: 'strong',
            children: [
              { kind: 'text', text: 'A ' },
              { kind: 'emphasis', children: [{ kind: 'text', text: 'big' }] },
              { kind: 'text', text: ' title' },
            ],
          },
        ],
      },
    ]);
  });

  it('should keep markdown inside an inline spoiler', () => {
    expect(toCommentNodes('[spoiler]a **twist**[/spoiler]')).toEqual([
      {
        kind: 'paragraph',
        children: [
          {
            kind: 'spoiler',
            children: [
              { kind: 'text', text: 'a ' },
              { kind: 'strong', children: [{ kind: 'text', text: 'twist' }] },
            ],
          },
        ],
      },
    ]);
  });

  it('should keep an escaped character as text', () => {
    expect(toCommentNodes('\\*not emphasis\\*')).toEqual([
      {
        kind: 'paragraph',
        children: [
          { kind: 'text', text: '*' },
          { kind: 'text', text: 'not emphasis' },
          { kind: 'text', text: '*' },
        ],
      },
    ]);
  });

  describe('for an unsafe body', () => {
    it('should give a script and raw HTML as text', () => {
      expect(toCommentNodes(bodyOf('xss'))).toEqual([
        {
          kind: 'paragraph',
          children: [{ kind: 'text', text: bodyOf('xss') }],
        },
      ]);
    });

    it('should give inline HTML as text', () => {
      expect(toCommentNodes('a <b>bold</b> word')).toEqual([
        {
          kind: 'paragraph',
          children: [
            { kind: 'text', text: 'a ' },
            { kind: 'text', text: '<b>' },
            { kind: 'text', text: 'bold' },
            { kind: 'text', text: '</b>' },
            { kind: 'text', text: ' word' },
          ],
        },
      ]);
    });

    it.each([
      'javascript:alert(1)',
      'data:text/html,hi',
      'mailto:a@b.c',
      '/movies/heretic',
    ])('should give a link to %s as its raw text', (href) => {
      expect(toCommentNodes(`[*x*](${href})`)).toEqual([
        {
          kind: 'paragraph',
          children: [{ kind: 'text', text: `[*x*](${href})` }],
        },
      ]);
    });

    it.each(['http://trakt.tv', 'https://trakt.tv'])(
      'should keep a link to %s',
      (href) => {
        expect(toCommentNodes(`[x](${href})`)).toEqual([
          {
            kind: 'paragraph',
            children: [
              { kind: 'link', href, children: [{ kind: 'text', text: 'x' }] },
            ],
          },
        ]);
      },
    );

    it('should give any other block as its text', () => {
      expect(toCommentNodes('```\ncode\n```')).toEqual([
        {
          kind: 'paragraph',
          children: [{ kind: 'text', text: '```\ncode\n```' }],
        },
      ]);
    });
  });

  describe('for a deeply nested body', () => {
    it.each([
      { nesting: '40 quotes', markdown: `${'>'.repeat(40)}x` },
      {
        nesting: '40 strong markers',
        markdown: `${'**'.repeat(40)}x${'**'.repeat(40)}`,
      },
      { nesting: '10000 quotes', markdown: `${'>'.repeat(10000)}x` },
    ])('should give a body of $nesting as its text', ({ markdown }) => {
      expect(toCommentNodes(markdown)).toEqual([
        { kind: 'paragraph', children: [{ kind: 'text', text: markdown }] },
      ]);
    });

    it('should keep a body of three quotes as quotes', () => {
      expect(toCommentNodes('>>>x')).toEqual([
        {
          kind: 'quote',
          children: [{
            kind: 'quote',
            children: [{
              kind: 'quote',
              children: [{
                kind: 'paragraph',
                children: [{ kind: 'text', text: 'x' }],
              }],
            }],
          }],
        },
      ]);
    });

    it('should hide the body when it holds a spoiler', () => {
      const markdown = `${'>'.repeat(40)}[spoiler]x[/spoiler]`;

      expect(toCommentNodes(markdown)).toEqual([
        {
          kind: 'paragraph',
          children: [
            { kind: 'spoiler', children: [{ kind: 'text', text: markdown }] },
          ],
        },
      ]);
    });
  });

  it('should keep a quote over its blocks', () => {
    expect(toCommentNodes('> one\n>\n> two')).toEqual([
      {
        kind: 'quote',
        children: [
          { kind: 'paragraph', children: [{ kind: 'text', text: 'one' }] },
          { kind: 'paragraph', children: [{ kind: 'text', text: 'two' }] },
        ],
      },
    ]);
  });

  it('should keep a strikethrough over its inline children', () => {
    expect(toCommentNodes('~~gone *now*~~')).toEqual([
      {
        kind: 'paragraph',
        children: [
          {
            kind: 'strikethrough',
            children: [
              { kind: 'text', text: 'gone ' },
              { kind: 'emphasis', children: [{ kind: 'text', text: 'now' }] },
            ],
          },
        ],
      },
    ]);
  });

  it('should drop a reference-link definition', () => {
    expect(toCommentNodes('[a][r]\n\n[r]: https://a.b')).toEqual([
      {
        kind: 'paragraph',
        children: [
          {
            kind: 'link',
            href: 'https://a.b',
            children: [{ kind: 'text', text: 'a' }],
          },
        ],
      },
    ]);
  });

  it("should keep a task item's box on the item's line", () => {
    expect(toCommentNodes('- [ ] task')).toEqual([
      {
        kind: 'list',
        ordered: false,
        children: [
          {
            kind: 'listItem',
            children: [
              { kind: 'text', text: '[ ] ' },
              { kind: 'text', text: 'task' },
            ],
          },
        ],
      },
    ]);
  });

  describe('for a spoiler inside another token', () => {
    const textNode = { kind: 'text', text: 'x' };
    const spoilerNode = { kind: 'spoiler', children: [textNode] };

    it('should keep a spoiler inside a quote', () => {
      expect(toCommentNodes('> [spoiler]x[/spoiler]')).toEqual([
        {
          kind: 'quote',
          children: [{ kind: 'paragraph', children: [spoilerNode] }],
        },
      ]);
    });

    it('should keep a spoiler inside a strikethrough', () => {
      expect(toCommentNodes('~~[spoiler]x[/spoiler]~~')).toEqual([
        {
          kind: 'paragraph',
          children: [{ kind: 'strikethrough', children: [spoilerNode] }],
        },
      ]);
    });

    it('should hide a link that is not to the web and holds a spoiler', () => {
      const link = '[[spoiler]x[/spoiler]](/rel)';

      expect(toCommentNodes(link)).toEqual([
        {
          kind: 'paragraph',
          children: [
            { kind: 'spoiler', children: [{ kind: 'text', text: link }] },
          ],
        },
      ]);
    });

    it.each([
      { markdown: '[[spoiler]x[/spoiler]](https://a.b)', text: textNode },
      {
        markdown: '[**[spoiler]x[/spoiler]**](https://a.b)',
        text: { kind: 'strong', children: [textNode] },
      },
    ])('should move the spoiler in $markdown outside the link', ({
      markdown,
      text,
    }) => {
      expect(toCommentNodes(markdown)).toEqual([
        {
          kind: 'paragraph',
          children: [
            {
              kind: 'spoiler',
              children: [{
                kind: 'link',
                href: 'https://a.b',
                children: [text],
              }],
            },
          ],
        },
      ]);
    });

    it('should hide a block given as text that holds a spoiler', () => {
      const table = '| a |\n|---|\n| [spoiler]x[/spoiler] |';

      expect(toCommentNodes(table)).toEqual([
        {
          kind: 'paragraph',
          children: [
            { kind: 'spoiler', children: [{ kind: 'text', text: table }] },
          ],
        },
      ]);
    });

    it.each(['`[spoiler]`', '`[/spoiler] [spoiler]`'])(
      'should keep inline text %s given as text with no spoiler pair plain',
      (code) => {
        expect(toCommentNodes(`Use ${code} tags`)).toEqual([
          {
            kind: 'paragraph',
            children: [
              { kind: 'text', text: 'Use ' },
              { kind: 'text', text: code },
              { kind: 'text', text: ' tags' },
            ],
          },
        ]);
      },
    );

    it('should hide inline text given as text that holds a spoiler', () => {
      expect(toCommentNodes('a `[spoiler]x[/spoiler]` b')).toEqual([
        {
          kind: 'paragraph',
          children: [
            { kind: 'text', text: 'a ' },
            {
              kind: 'spoiler',
              children: [{ kind: 'text', text: '`[spoiler]x[/spoiler]`' }],
            },
            { kind: 'text', text: ' b' },
          ],
        },
      ]);
    });
  });
});
