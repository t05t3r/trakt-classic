<script lang="ts">
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import StatusFrame from '$lib/components/feedback/StatusFrame.svelte';
  import { useCommentReplies } from '$lib/features/comments/stores/useCommentReplies.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import CommentCard from '../CommentCard.svelte';
  import type { CommentRepliesProps } from './CommentRepliesProps.ts';

  const { id, describedBy, treatAsSpoiler, revealSpoilers }:
    CommentRepliesProps = $props();

  // Its thread is keyed by the comment, so the id never changes under it.
  // svelte-ignore state_referenced_locally
  const status = useCommentReplies(id);
</script>

<StatusFrame status={$status} {describedBy}>
  {#snippet empty()}
    <div class="comment-replies-empty">
      <EmptyState>{m.text_comment_replies_empty()}</EmptyState>
    </div>
  {/snippet}
  {#snippet children(replies)}
    <ul class="comment-replies-list" role="list">
      {#each replies as reply (reply.key)}
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
  {/snippet}
</StatusFrame>

<style lang="scss">
  .comment-replies-empty {
    margin-block-start: var(--ni-20);
  }

  .comment-replies-list {
    margin: var(--ni-0);
    padding: var(--ni-0);
    list-style: none;

    .comment-reply {
      margin-block-start: var(--ni-20);
    }
  }
</style>
