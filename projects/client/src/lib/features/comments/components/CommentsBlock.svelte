<script lang="ts">
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import StatusFrame from '$lib/components/feedback/StatusFrame.svelte';
  import LoadMore from '$lib/components/pagination/LoadMore.svelte';
  import PillTabs from '$lib/components/tabs/PillTabs.svelte';
  import { useHideCommentSpoilers } from '$lib/features/auth/stores/useHideCommentSpoilers.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
  import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
  import { toWatchedProps } from '$lib/features/media-actions/toWatchedProps.ts';
  import { CommentSortTypeSchema } from '$lib/requests/models/CommentSortType.ts';
  import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
  import type { CommentsReveal } from '../_internal/revealComments.ts';
  import { useComments } from '../stores/useComments.ts';
  import CommentThread from './_internal/CommentThread.svelte';
  import type { CommentsBlockProps } from './CommentsBlockProps.ts';

  type ShownComments = { data: CommentsReveal; treatAsSpoiler: boolean };

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
  const paneStatus: SectionStatus<ShownComments> = $derived.by(() => {
    if ($status.kind !== 'ready') return $status;
    if ($hideSpoilers === undefined) return { kind: 'loading' };
    return {
      kind: 'ready',
      data: { data: $status.data, treatAsSpoiler: $hideSpoilers },
    };
  });
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
      <StatusFrame status={paneStatus} describedBy={tabId}>
        {#snippet empty()}
          <EmptyState>{m.text_comments_empty()}</EmptyState>
        {/snippet}
        {#snippet children(shown)}
          <ul class="comment-cells" role="list">
            {#each shown.data.comments as comment (comment.key)}
              <li class="comment-cell">
                <CommentThread
                  {comment}
                  {airedEpisodes}
                  treatAsSpoiler={shown.treatAsSpoiler}
                  revealSpoilers={isTargetWatched}
                />
              </li>
            {/each}
          </ul>
          <LoadMore
            showMore={shown.data.showMore}
            showLess={shown.data.showLess}
            onmore={more}
            onless={less}
          />
        {/snippet}
      </StatusFrame>
    {/snippet}
  </PillTabs>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-comments-block {
    // The positioned parent of the "more" pill, which sits out of flow.
    :global(.trakt-status-frame) {
      position: relative;
      margin-block-start: var(--ni-20);
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
