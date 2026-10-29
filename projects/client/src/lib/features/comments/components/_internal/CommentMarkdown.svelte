<script lang="ts">
  import {
    type CommentNode,
    toCommentNodes,
  } from '$lib/features/comments/_internal/marked/toCommentNodes.ts';
  import SpoilerReveal from './SpoilerReveal.svelte';

  const { markdown }: { markdown: string } = $props();

  const nodes = $derived(toCommentNodes(markdown));
</script>

{#snippet renderNodes(list: ReadonlyArray<CommentNode>)}
  {#each list as node, index (index)}
    {#if node.kind === 'paragraph'}
      <p class="comment-block">{@render renderNodes(node.children)}</p>
    {:else if node.kind === 'quote'}
      <blockquote class="comment-block">
        {@render renderNodes(node.children)}
      </blockquote>
    {:else if node.kind === 'list'}
      <svelte:element this={node.ordered ? 'ol' : 'ul'} class="comment-block">
        {@render renderNodes(node.children)}
      </svelte:element>
    {:else if node.kind === 'listItem'}
      <li>{@render renderNodes(node.children)}</li>
    {:else if node.kind === 'strong'}
      <strong>{@render renderNodes(node.children)}</strong>
    {:else if node.kind === 'emphasis'}
      <em>{@render renderNodes(node.children)}</em>
    {:else if node.kind === 'strikethrough'}
      <del>{@render renderNodes(node.children)}</del>
    {:else if node.kind === 'link'}
      <a
        class="comment-link"
        href={node.href}
        target="_blank"
        rel="external nofollow noopener noreferrer"
      >{@render renderNodes(node.children)}</a>
    {:else if node.kind === 'spoiler'}
      <SpoilerReveal display="inline">
        {@render renderNodes(node.children)}
      </SpoilerReveal>
    {:else if node.kind === 'break'}
      <br />
    {:else}
      {node.text}
    {/if}
  {/each}
{/snippet}

<div class="trakt-comment-markdown">
  {@render renderNodes(nodes)}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-comment-markdown {
    .comment-block {
      margin-block: var(--ni-0) var(--ni-10);

      &:last-child {
        margin-block-end: var(--ni-0);
      }
    }

    .comment-link {
      @include default-link-style;
    }
  }
</style>
