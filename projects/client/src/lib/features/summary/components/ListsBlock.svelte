<script lang="ts">
  import Pill from '$lib/components/badges/Pill.svelte';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import ListRow from '$lib/components/lists/ListRow.svelte';
  import PosterStack from '$lib/components/media/PosterStack.svelte';
  import MessageWithBold from '$lib/components/text/MessageWithBold.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import type { MediaListSummary } from '$lib/requests/models/MediaListSummary.ts';
  import { toDisplayableName } from '$lib/utils/profile/toDisplayableName.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

  const { status }: {
    status: SectionStatus<ReadonlyArray<MediaListSummary>>;
  } = $props();

  // A personal list's page needs its owner's slug, which the API may omit.
  const hrefOf = (list: MediaListSummary) => {
    if (list.type === 'official') return UrlBuilder.lists.official(list.slug);
    if (!list.user.slug) return undefined;

    return UrlBuilder.users(list.user.slug).lists(list.slug);
  };
</script>

<div class="trakt-lists-block">
  <SectionState
    header={{ title: m.page_title_lists() }}
    {status}
    emptyText={m.text_lists_block_empty()}
  >
    {#snippet children(lists)}
      <div class="lists-block-rows">
        {#each lists as list (list.key)}
          {#snippet byOwner()}
            <MessageWithBold
              message={m.text_lists_by({ name: toDisplayableName(list.user) })}
            />
          {/snippet}
          {#snippet officialOwner()}
            <Pill>{m.text_lists_official_owner()}</Pill>
          {/snippet}
          {#snippet posters()}
            <PosterStack items={list.posters} key={(poster) => poster.url.thumb}>
              {#snippet poster(entry)}
                <LazyImage src={entry.url.thumb} alt="" kind="poster" />
              {/snippet}
            </PosterStack>
          {/snippet}
          {#snippet avatar()}
            <LazyImage src={list.user.avatar.url} alt="" kind="avatar" />
          {/snippet}
          <ListRow
            name={list.name}
            href={hrefOf(list)}
            owner={list.type === 'official' ? officialOwner : byOwner}
            description={list.description}
            count={list.count}
            {posters}
            {avatar}
            variant="summary"
          />
        {/each}
      </div>
    {/snippet}
  </SectionState>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-lists-block {
    @include for-mobile {
      .lists-block-rows {
        margin-inline: var(--gutter-half-negative);
        margin-block-end: var(--gutter-half-negative);
      }
    }
  }
</style>
