<script lang="ts">
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import SectionError from '$lib/components/feedback/SectionError.svelte';
  import LoadMore from '$lib/components/pagination/LoadMore.svelte';
  import PillTabs from '$lib/components/tabs/PillTabs.svelte';
  import { useHideCommentSpoilers } from '$lib/features/auth/stores/useHideCommentSpoilers.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
  import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
  import { toWatchedProps } from '$lib/features/media-actions/toWatchedProps.ts';
  import { CommentSortTypeSchema } from '$lib/requests/models/CommentSortType.ts';
  import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
  import { useComments } from '../stores/useComments.ts';
  import CommentThread from './_internal/CommentThread.svelte';
  import type { CommentsBlockProps } from './CommentsBlockProps.ts';

  const TABS = [
    {
      value: 'likes',
      text: m.text_comments_tab_likes(),
      count: m.text_comments_tab_all_time(),
    },
    { value: 'newest', text: m.text_comments_tab_recent() },
  ];

  // A movie or an episode has none, so its cards read the author's plays.
  const airedEpisodesOf = (media: QuickActionsTarget) => {
    switch (media.type) {
      case 'show':
        return media.episode.count;
      case 'season':
        return media.episodes.aired;
      default:
        return undefined;
    }
  };

  const { target, media, progress }: CommentsBlockProps = $props();

  // Keyed by its Target at the caller, so the store made here serves the block's whole life.
  // svelte-ignore state_referenced_locally
  const { sort, select, status, more, less } = useComments(target);

  const selectTab = (value: string) => {
    const parsed = CommentSortTypeSchema.safeParse(value);
    if (!parsed.success) return;
    void select(parsed.data);
  };

  const airedEpisodes = $derived(airedEpisodesOf(media));

  const hideSpoilers = useHideCommentSpoilers();
  // Keyed by its Target at the caller; a show or a season reads its progress instead.
  // svelte-ignore state_referenced_locally
  const isWatched = media.type === 'movie' || media.type === 'episode'
    ? useWatched(toWatchedProps(media)).isWatched
    : undefined;

  const isTargetWatched = $derived(
    isWatched
      ? ($isWatched ?? false)
      : progress?.kind === 'ready' && isProgressComplete(progress.data),
  );

  // The cards wait for the setting, so a hidden spoiler never shows before it blurs.
  const ready = $derived(
    $status.kind === 'ready' && $hideSpoilers !== undefined
      ? { data: $status.data, treatAsSpoiler: $hideSpoilers }
      : undefined,
  );

  const isPending = $derived(
    $status.kind === 'loading' || ($status.kind === 'ready' && !ready),
  );

  let pane: HTMLElement | undefined = $state();
</script>

<div class="trakt-comments-block">
  <PillTabs
    label={m.text_comments_title()}
    tabs={TABS}
    value={$sort}
    onValueChange={selectTab}
  >
    <!-- The shown tab names the pane, so it describes the pane's retry too. -->
    {#snippet children(_sort, tabId)}
      <div
        class="comments-pane"
        aria-busy={isPending}
        bind:this={pane}
      >
        {#if isPending}
          <div class="comments-pending"><PendingSpinner /></div>
        {:else if $status.kind === 'error'}
          <SectionError
            retry={$status.retry}
            fallback={pane}
            describedBy={tabId}
          />
        {:else if $status.kind === 'empty'}
          <EmptyState>{m.text_comments_empty()}</EmptyState>
        {:else if ready}
          <ul class="comment-cells" role="list">
            {#each ready.data.comments as comment (comment.key)}
              <li class="comment-cell">
                <CommentThread
                  {comment}
                  {airedEpisodes}
                  treatAsSpoiler={ready.treatAsSpoiler}
                  revealSpoilers={isTargetWatched}
                />
              </li>
            {/each}
          </ul>
          <LoadMore
            showMore={ready.data.showMore}
            showLess={ready.data.showLess}
            onmore={more}
            onless={less}
          />
        {/if}
      </div>
    {/snippet}
  </PillTabs>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-comments-block {
    // The positioned parent of the "more" pill, which sits out of flow.
    .comments-pane {
      position: relative;
      margin-block-start: var(--ni-20);

      // It takes focus only as a retry's fallback, and a ring would outline the whole pane.
      &:focus {
        outline: none;
      }
    }

    .comments-pending {
      --pending-spinner-size: var(--icon-size-heading);
      --pending-spinner-stroke: var(--icon-stroke-chrome);
    }

    .comment-cells {
      margin: var(--ni-0);
      padding: var(--ni-0);
      list-style: none;
    }

    .comment-cell + .comment-cell {
      margin-block-start: var(--ni-20);
    }

    // A phone card runs to the screen's edges, flush with the next one.
    @include for-mobile {
      .comment-cell {
        margin-inline: var(--ni-neg-20) var(--ni-neg-10);
      }

      .comment-cell + .comment-cell {
        margin-block-start: var(--ni-0);
      }
    }
  }
</style>
