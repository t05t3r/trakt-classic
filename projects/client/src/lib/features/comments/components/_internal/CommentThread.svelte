<script lang="ts">
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import IconMessageCircleFilled from '@tabler/icons-svelte/icons/message-circle-filled';
  import CommentCard from '../CommentCard.svelte';
  import CommentReplies from './CommentReplies.svelte';
  import type { CommentThreadProps } from './CommentThreadProps.ts';

  const {
    comment,
    airedEpisodes,
    treatAsSpoiler,
    revealSpoilers,
  }: CommentThreadProps = $props();

  const repliesId = $props.id();
  const headingId = `${repliesId}-heading`;

  let isOpen = $state(false);

  const replies = $derived(
    countText.parts({ count: comment.replyCount, unit: 'replies' }),
  );
</script>

<div class="trakt-comment-thread">
  <CommentCard
    {comment}
    placement="block"
    {headingId}
    {airedEpisodes}
    {treatAsSpoiler}
    {revealSpoilers}
  >
    {#snippet replyCount()}
      {#if comment.replyCount === 0}
        <span>{replies.count}</span>
      {:else}
        <button
          type="button"
          class="comment-replies-toggle"
          aria-expanded={isOpen}
          aria-controls={repliesId}
          onclick={() => (isOpen = !isOpen)}
        >
          <!-- No space after the glyph: its margin is the whole gap to the figure. -->
          <IconMessageCircleFilled
            class="comment-replies-glyph"
            aria-hidden="true"
          /><b>{replies.figure}</b>
          <span class="comment-replies-word">{replies.word}</span>
        </button>
      {/if}
    {/snippet}
  </CommentCard>

  <!-- Mounted on the press, so the replies load only once asked for. -->
  <div id={repliesId} class="thread-replies">
    {#if isOpen}
      <CommentReplies
        id={comment.id}
        describedBy={headingId}
        {treatAsSpoiler}
        {revealSpoilers}
      />
    {/if}
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-comment-thread {
    .comment-replies-toggle {
      padding: var(--ni-0);
      border: none;
      background: none;
      color: var(--color-count);
      font: inherit;
      text-transform: inherit;
      cursor: pointer;
    }

    :global(.comment-replies-glyph) {
      width: var(--icon-size-comment-replies);
      height: var(--icon-size-comment-replies);
      margin-inline-end: var(--ni-5);
      vertical-align: middle;
    }

    @include for-tablet-sm-and-below {
      .comment-replies-word {
        @include visually-hidden;
      }
    }
  }
</style>
