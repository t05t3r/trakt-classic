import { toUrl } from '$lib/utils/url/toUrl.ts';
import { Marked, type Token } from 'marked';
import { spoilerExtension } from './spoilerExtension.ts';

export type CommentNode =
  | { kind: 'paragraph'; children: ReadonlyArray<CommentNode> }
  | { kind: 'quote'; children: ReadonlyArray<CommentNode> }
  | { kind: 'strong'; children: ReadonlyArray<CommentNode> }
  | { kind: 'emphasis'; children: ReadonlyArray<CommentNode> }
  | { kind: 'strikethrough'; children: ReadonlyArray<CommentNode> }
  | { kind: 'spoiler'; children: ReadonlyArray<CommentNode> }
  | { kind: 'list'; ordered: boolean; children: ReadonlyArray<CommentNode> }
  | { kind: 'listItem'; children: ReadonlyArray<CommentNode> }
  | { kind: 'link'; href: string; children: ReadonlyArray<CommentNode> }
  | { kind: 'break' }
  | { kind: 'text'; text: string };

const WEB_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);

const SPOILER_PAIR = /\[spoiler\].*?\[\/spoiler\]/s;

const MAX_NESTING = 32;

const marked = new Marked({
  gfm: true,
  breaks: true,
  extensions: [spoilerExtension()],
});

function childTokensOf(token: Token): Token[] {
  if (!('tokens' in token)) return [];
  return token.tokens ?? [];
}

function inlineChildrenOf(token: Token): ReadonlyArray<CommentNode> {
  return toInlineNodes(childTokensOf(token));
}

function textOf(token: Token): string {
  if (!('text' in token) || typeof token.text !== 'string') return token.raw;
  return token.text;
}

// Text printed as written would show a spoiler it holds, so it blurs whole.
function toRawTextNode(text: string): CommentNode {
  const node: CommentNode = { kind: 'text', text };
  if (!SPOILER_PAIR.test(text)) return node;

  return { kind: 'spoiler', children: [node] };
}

function webHrefOf(token: Token): string | undefined {
  if (!('href' in token) || typeof token.href !== 'string') return undefined;

  const protocol = toUrl(token.href)?.protocol;
  if (!protocol || !WEB_PROTOCOLS.has(protocol)) return undefined;

  return token.href;
}

function holdsSpoiler(nodes: ReadonlyArray<CommentNode>): boolean {
  return nodes.some((node) =>
    node.kind === 'spoiler' ||
    ('children' in node && holdsSpoiler(node.children))
  );
}

function withoutSpoilers(
  nodes: ReadonlyArray<CommentNode>,
): ReadonlyArray<CommentNode> {
  return nodes.flatMap((node): ReadonlyArray<CommentNode> => {
    if (node.kind === 'spoiler') return withoutSpoilers(node.children);
    if (!('children' in node)) return [node];

    return [{ ...node, children: withoutSpoilers(node.children) }];
  });
}

// A spoiler's reveal button may not sit inside a link, so it wraps the link.
function toLinkNodes(token: Token): ReadonlyArray<CommentNode> {
  const href = webHrefOf(token);
  if (!href) return [toRawTextNode(token.raw)];

  const children = inlineChildrenOf(token);
  if (!holdsSpoiler(children)) return [{ kind: 'link', href, children }];

  const link: CommentNode = {
    kind: 'link',
    href,
    children: withoutSpoilers(children),
  };
  return [{ kind: 'spoiler', children: [link] }];
}

function toInlineNode(token: Token): ReadonlyArray<CommentNode> {
  switch (token.type) {
    case 'text':
    case 'escape':
      return [{ kind: 'text', text: textOf(token) }];
    case 'strong':
      return [{ kind: 'strong', children: inlineChildrenOf(token) }];
    case 'em':
      return [{ kind: 'emphasis', children: inlineChildrenOf(token) }];
    case 'del':
      return [{ kind: 'strikethrough', children: inlineChildrenOf(token) }];
    case 'spoiler':
      return [{ kind: 'spoiler', children: inlineChildrenOf(token) }];
    case 'br':
      return [{ kind: 'break' }];
    case 'link':
      return toLinkNodes(token);
    default:
      return [toRawTextNode(token.raw)];
  }
}

function toInlineNodes(tokens: Token[]): ReadonlyArray<CommentNode> {
  return tokens.flatMap(toInlineNode);
}

function listItemsOf(token: Token): Token[] {
  if (!('items' in token) || !Array.isArray(token.items)) return [];
  return token.items;
}

// A tight list item holds its line as a block text with inline tokens.
function toBlockText(token: Token): ReadonlyArray<CommentNode> {
  const children = childTokensOf(token);
  if (children.length === 0) return [{ kind: 'text', text: textOf(token) }];

  return toInlineNodes(children);
}

function toBlockNode(token: Token): ReadonlyArray<CommentNode> {
  switch (token.type) {
    case 'space':
    case 'def':
      return [];
    case 'paragraph':
      return [{ kind: 'paragraph', children: inlineChildrenOf(token) }];
    case 'heading':
      return [{
        kind: 'paragraph',
        children: [{ kind: 'strong', children: inlineChildrenOf(token) }],
      }];
    case 'blockquote':
      return [{ kind: 'quote', children: toBlockNodes(childTokensOf(token)) }];
    case 'text':
      return toBlockText(token);
    // A tight task item's box stays on the item's line, as its text.
    case 'checkbox':
      return [{ kind: 'text', text: token.raw }];
    case 'list':
      return [{
        kind: 'list',
        ordered: 'ordered' in token && token.ordered === true,
        children: listItemsOf(token).flatMap(toBlockNode),
      }];
    case 'list_item':
      return [{
        kind: 'listItem',
        children: toBlockNodes(childTokensOf(token)),
      }];
    default:
      return [{
        kind: 'paragraph',
        children: [toRawTextNode(token.raw.trim())],
      }];
  }
}

function toBlockNodes(tokens: Token[]): ReadonlyArray<CommentNode> {
  return tokens.flatMap(toBlockNode);
}

function nestsWithin(
  nodes: ReadonlyArray<CommentNode>,
  levels: number,
): boolean {
  return nodes.every((node) => {
    if (!('children' in node)) return true;
    if (levels === 0) return false;

    return nestsWithin(node.children, levels - 1);
  });
}

function toRawTextNodes(markdown: string): ReadonlyArray<CommentNode> {
  return [{ kind: 'paragraph', children: [toRawTextNode(markdown)] }];
}

// The render recurses once per level, and engines name a stack overflow
// differently, so a deep body or any parse failure shows as its raw text.
export function toCommentNodes(markdown: string): ReadonlyArray<CommentNode> {
  try {
    const nodes = toBlockNodes(marked.lexer(markdown));
    return nestsWithin(nodes, MAX_NESTING) ? nodes : toRawTextNodes(markdown);
  } catch {
    return toRawTextNodes(markdown);
  }
}
