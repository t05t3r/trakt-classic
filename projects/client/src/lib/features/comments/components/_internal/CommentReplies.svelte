<script lang="ts">
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import SectionError from '$lib/components/feedback/SectionError.svelte';
  import { useCommentReplies } from '$lib/features/comments/stores/useCommentReplies.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import CommentCard from '../CommentCard.svelte';
  import type { CommentRepliesProps } from './CommentRepliesProps.ts';

  const { id, describedBy, treatAsSpoiler, revealSpoilers }:
    CommentRepliesProps = $props();

  // Its thread is keyed by the comment, so the id never changes under it.
  // svelte-ignore state_referenced_locally
  const status = useCommentReplies(id);

  let box: HTMLElement | undefined = $state();
</script>

<div
  class="trakt-comment-replies"
  aria-busy={$status.kind === 'loading'}
  bind:this={box}
>
  {#if $status.kind === 'loading'}
    <div class="comment-replies-pending"><PendingSpinner /></div>
  {:else if $status.kind === 'error'}
    <SectionError retry={$status.retry} fallback={box} {describedBy} />
  {:else if $status.kind === 'empty'}
    <div class="comment-replies-empty">
      <EmptyState>{m.text_comment_replies_empty()}</EmptyState>
    </div>
  {:else}
    <ul class="comment-replies-list" role="list">
      {#each $status.data as reply (reply.key)}
        <li class="comment-reply">
          <CommentCard
            comment={reply}
            placement="reply"
            {treatAsSpoiler}
            {revealSpoilers}
          />
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style lang="scss">
  .trakt-comment-replies {
    margin-inline-start: var(--ni-20);

    // It takes focus only as a retry's fallback, and a ring would outline every reply.
    &:focus {
      outline: none;
    }

    .comment-replies-pending {
      --pending-spinner-size: var(--icon-size-heading);
      --pending-spinner-stroke: var(--icon-stroke-chrome);

      margin-block-start: var(--ni-20);
    }

    .comment-replies-empty {
      margin-block-start: var(--ni-20);
    }

    .comment-replies-list {
      margin: var(--ni-0);
      padding: var(--ni-0);
      list-style: none;
    }

    .comment-reply {
      margin-block-start: var(--ni-20);
    }
  }
</style>
