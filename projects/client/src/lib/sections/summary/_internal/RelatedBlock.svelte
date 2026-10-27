<script lang="ts">
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import PosterGrid from '$lib/components/media/PosterGrid.svelte';
  import MessageWithBold from '$lib/components/text/MessageWithBold.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import MediaPosterCard from '$lib/features/media-card/components/MediaPosterCard.svelte';
  import UserRatingCorner from '$lib/features/media-card/components/UserRatingCorner.svelte';
  import {
    type MediaCardInput,
    toMediaCard,
  } from '$lib/features/media-card/toMediaCard.ts';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';

  type RelatedEntry = Extract<MediaCardInput, { type: 'movie' | 'show' }>;

  const { title, status }: {
    title: string;
    status: SectionStatus<ReadonlyArray<RelatedEntry>>;
  } = $props();

  // Classic shows four of the six at tablet width.
  const TABLET_LIMIT = 4;

  const mediaOf = (entry: RelatedEntry) =>
    entry.type === 'movie' ? entry.movie : entry.show;
</script>

{#snippet heading()}
  <MessageWithBold message={m.text_related_title({ title })} />
{/snippet}

{#if status.kind !== 'empty'}
  <div class="trakt-related-block">
    <ContainerPage>
      <SectionState
        header={{ title: heading, spacing: 'wide' }}
        {status}
      >
        {#snippet children(entries)}
          <PosterGrid
            items={entries}
            key={(entry) => mediaOf(entry).key}
            phoneDivider="none"
            gaps="none"
            tabletLimit={TABLET_LIMIT}
          >
            {#snippet item(entry)}
              {@const media = mediaOf(entry)}
              {@const card = toMediaCard(entry)}
              <MediaPosterCard
                {card}
                poster={media.poster}
                posterTitle={media.title}
              >
                {#snippet badges()}
                  <UserRatingCorner
                    target={{ type: card.target.type, id: card.target.id }}
                  />
                {/snippet}
              </MediaPosterCard>
            {/snippet}
          </PosterGrid>
        {/snippet}
      </SectionState>
    </ContainerPage>
  </div>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-related-block {
    display: flow-root;
    box-sizing: border-box;
    min-height: var(--related-min-height);
    padding-block-end: var(--gap-l);
    background: var(--color-surface-raised);

    @include for-tablet-lg {
      min-height: var(--related-min-height-tablet-lg);
    }

    @include for-mobile {
      margin-block-end: var(--ni-10);
    }
  }
</style>
