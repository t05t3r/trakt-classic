<script lang="ts">
  import CornerRating from '$lib/components/badges/CornerRating.svelte';
  import Pill from '$lib/components/badges/Pill.svelte';
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import ClampedText from '$lib/components/text/ClampedText.svelte';
  import MessageWithBold from '$lib/components/text/MessageWithBold.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import { toDisplayableName } from '$lib/utils/profile/toDisplayableName.ts';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import { toWatchedStat } from '../_internal/toWatchedStat.ts';
  import type { CommentCardProps } from './_internal/CommentCardProps.ts';
  import CommentMarkdown from './_internal/CommentMarkdown.svelte';
  import SpoilerReveal from './_internal/SpoilerReveal.svelte';

  const {
    comment,
    placement,
    airedEpisodes,
    replyCount,
    headingId,
    treatAsSpoiler = false,
    revealSpoilers = false,
  }: CommentCardProps = $props();

  const hydrated = useHydrated();

  const name = $derived(toDisplayableName(comment.user));
  const rating = $derived(comment.user.stats.rating);
  const watchedStat = $derived(
    toWatchedStat({ stats: comment.user.stats, airedEpisodes }),
  );
  const isReply = $derived(placement === 'reply');
  const isSpoiler = $derived(comment.isSpoiler || treatAsSpoiler);
  const kindLine = $derived(
    comment.isReview
      ? m.text_comment_review({ name })
      : m.text_comment_shout({ name }),
  );
</script>

<article class="trakt-comment-card" data-placement={placement}>
  <header class="comment-header">
    <div class="comment-avatar" data-rating={rating ?? undefined}>
      {#if rating != null}
        <span class="avatar-rating-block"></span>
        <CornerRating
          {rating}
          size="sm"
          label={m.label_comment_rating({ name, rating })}
        />
      {/if}
      <div class="avatar-image">
        <LazyImage src={comment.user.avatar.url} alt="" kind="avatar" />
      </div>
    </div>
    <div class="comment-author">
      <!-- A reply sits under its comment, so its heading ranks one below. -->
      <svelte:element
        this={isReply ? 'h4' : 'h3'}
        id={headingId}
        class="comment-kind"
      >
        <MessageWithBold message={kindLine} />
      </svelte:element>
      <div class="comment-labels">
        {#if comment.isSpoiler}
          <Pill>{m.text_spoiler()}</Pill>
        {/if}
        <!-- The time is the viewer's, which the server cannot know. -->
        {#if $hydrated}
          <span class="comment-date">
            <FormattedDate
              date={comment.createdAt}
              pattern="d MMM yyyy HH:mm"
              swap={false}
            />
          </span>
        {/if}
      </div>
    </div>
  </header>

  {#snippet clampedBody()}
    <ClampedText>
      <CommentMarkdown markdown={comment.comment} />
    </ClampedText>
  {/snippet}

  <div class="comment-body">
    {#if isSpoiler}
      <SpoilerReveal display="block" revealed={revealSpoilers}>
        {@render clampedBody()}
      </SpoilerReveal>
    {:else}
      {@render clampedBody()}
    {/if}
  </div>

  {#if !isReply && (watchedStat || replyCount)}
    <footer class="comment-footer">
      {#if watchedStat}
        <span class="comment-watched">
          <IconCheck class="comment-watched-glyph" aria-hidden="true" />
          <b>{watchedStat.figure}</b>
          {watchedStat.word}
        </span>
      {/if}
      {@render replyCount?.()}
    </footer>
  {/if}
</article>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-comment-card {
    --clamp-shade-color: var(--color-surface-card);

    border-radius: var(--border-radius-xxs);
    background: var(--color-surface-card);

    .comment-header {
      display: flex;
      align-items: flex-start;
      padding: var(--ni-20) var(--ni-20) var(--ni-10);
      background: var(--color-surface-menu);
    }

    // The ring and the square behind the corner share the author's rating.
    .comment-avatar {
      --comment-rating-color: var(--color-avatar-ring);

      position: relative;
      flex: none;
      width: var(--avatar-size-m);
      height: var(--avatar-size-m);
      // Its foot below the image sets the header's height.
      margin-block: var(--ni-neg-8) var(--ni-5);
      margin-inline-start: var(--ni-neg-8);

      @for $rating from 1 through 10 {
        &[data-rating='#{$rating}'] {
          --comment-rating-color: var(--color-rating-#{$rating});
        }
      }
    }

    .avatar-image {
      @include ringed-avatar(var(--comment-rating-color));

      width: 100%;
      height: 100%;
    }

    .avatar-rating-block {
      position: absolute;
      inset-block-start: var(--ni-0);
      inset-inline-end: var(--ni-0);
      z-index: var(--layer-base);
      width: 50%;
      height: 50%;
      background: var(--comment-rating-color);
    }

    .comment-author {
      flex: 1;
      min-width: var(--ni-0);
      padding-inline-start: var(--ni-12);
    }

    .comment-kind {
      margin: var(--ni-neg-4) var(--ni-0) var(--ni-0);
      font-size: var(--font-size-small);
      line-height: var(--line-height-heading);

      // The author's name takes the heading weight, not the browser's bolder.
      :global(b) {
        font-weight: var(--font-weight-heading);
      }
    }

    .comment-labels {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ni-5);
      padding-block-start: var(--ni-4);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-small);
      line-height: var(--line-height-heading);
    }

    .comment-date {
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-heading);
    }

    .comment-body {
      padding: var(--ni-20);
      overflow-wrap: break-word;
    }

    .comment-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ni-15);
      margin-block-start: var(--ni-3);
      padding: var(--ni-0) var(--ni-20) var(--ni-20);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-heading-light);
      text-transform: uppercase;
    }

    .comment-watched {
      color: var(--color-action-watch);
    }

    :global(.comment-watched-glyph) {
      width: var(--icon-size-comment-watched);
      height: var(--icon-size-comment-watched);
      margin-inline-end: var(--ni-5);
      stroke-width: var(--icon-stroke-strip);
      vertical-align: middle;
    }

    // The hub lays the card on its fanart and pins the header to the pane's foot.
    &[data-placement='hub'] {
      background: transparent;

      .comment-header {
        position: absolute;
        inset-block-end: var(--ni-0);
        box-sizing: border-box;
        width: 100%;
        background: var(--color-surface-recessed);
      }

      .comment-body {
        padding: var(--ni-20) var(--ni-30) var(--ni-80);
      }
    }

    @include for-mobile {
      padding-block-end: var(--ni-15);

      .comment-avatar {
        margin-inline-start: var(--ni-0);
      }

      // Every placement takes the phone padding, the hub's included.
      &[data-placement] .comment-body {
        padding-block: var(--ni-10);
        padding-inline: var(--ni-20) var(--ni-10);
      }

      .comment-footer {
        padding-block-end: var(--ni-10);
      }

      &[data-placement='block'] .comment-header {
        padding-inline-end: var(--ni-10);
      }

      &[data-placement='hub'] {
        padding-block-end: var(--ni-70);
      }
    }
  }
</style>
