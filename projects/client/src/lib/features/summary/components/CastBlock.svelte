<script lang="ts">
  import { resolve } from '$app/paths';
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import PillTabs from '$lib/components/tabs/PillTabs.svelte';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { CastMember } from '$lib/requests/models/MediaCrew.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import type { CastGroup, CastGroupKey } from '../_internal/CastGroup.ts';
  import { useCastTab } from '../stores/useCastTab.ts';
  import type { CastBlockProps } from './_internal/CastBlockProps.ts';

  const TAB_LABELS: Readonly<Record<CastGroupKey, () => string>> = {
    cast: m.text_cast_tab_cast,
    regulars: m.text_cast_tab_regulars_series,
    seasonRegulars: m.text_cast_tab_regulars_season,
    guest: m.text_cast_tab_guest_stars,
  };

  const { status }: CastBlockProps = $props();

  const { tab, select } = useCastTab();

  const toTabs = (groups: ReadonlyArray<CastGroup>) =>
    groups.map(({ key, members }) => ({
      value: key,
      text: TAB_LABELS[key](),
      count: toGroupedNumber(members.length),
    }));

  const groupOf = (groups: ReadonlyArray<CastGroup>, key: string | null) =>
    groups.find((group) => group.key === key);

  const shownKey = (groups: ReadonlyArray<CastGroup>) =>
    (groupOf(groups, $tab) ?? groups.at(0))?.key ?? '';

  const episodesOf = ({ episodeCount }: CastMember) =>
    episodeCount === undefined
      ? undefined
      : countText.of({ count: episodeCount, unit: 'episodes' });

  // A movie cell has no episode line, and a role the API left blank no character line.
  const toTooltip = (member: CastMember) =>
    [member.name, member.characterName, episodesOf(member)]
      .filter(Boolean)
      .join('\n');

  const selectTab = (groups: ReadonlyArray<CastGroup>, value: string) => {
    const group = groupOf(groups, value);
    if (!group) return;
    select(group.key);
  };
</script>

<div class="trakt-cast-block">
  <SectionState
    header={{ title: m.list_title_actors() }}
    {status}
    emptyText={m.text_cast_empty()}
  >
    {#snippet children(groups)}
      <PillTabs
        label={m.list_title_actors()}
        tabs={toTabs(groups)}
        value={shownKey(groups)}
        onValueChange={(value) => selectTab(groups, value)}
      >
        {#snippet children(value)}
          {@const members = groupOf(groups, value)?.members ?? []}
          {#if members.length === 0}
            <EmptyState>{m.text_cast_empty()}</EmptyState>
          {:else}
            <ul class="cast-cells" role="list">
              {#each members as member (member.key)}
                <li class="cast-cell">
                  <a
                    class="cast-link"
                    href={resolve(UrlBuilder.people(member.key))}
                    title={toTooltip(member)}
                  >
                    <span class="cast-headshot">
                      <LazyImage src={member.headshot.url.thumb} alt="" kind="poster" />
                    </span>
                    <span class="cast-titles">
                      <span class="cast-line cast-name ellipsis">{member.name}</span>
                      <span class="cast-line cast-character ellipsis">{member.characterName}</span>
                      <span class="cast-line cast-count ellipsis">{episodesOf(member)}</span>
                    </span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        {/snippet}
      </PillTabs>
    {/snippet}
  </SectionState>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-cast-block {
    .cast-cells {
      display: flex;
      margin: var(--ni-20) var(--ni-0);
      padding: var(--ni-0);
      overflow-x: auto;
      list-style: none;

      &::-webkit-scrollbar {
        height: var(--ni-6);
      }

      &::-webkit-scrollbar-track {
        border-radius: var(--border-radius-xs);
        background: var(--color-scrollbar-track);
      }

      &::-webkit-scrollbar-thumb {
        border-radius: var(--border-radius-xs);
        background: var(--color-scrollbar-thumb);

        &:hover {
          background: var(--color-scrollbar-thumb-hover);
        }
      }

      @supports not selector(::-webkit-scrollbar) {
        scrollbar-width: thin;
        scrollbar-color: var(--color-scrollbar-thumb-standard)
          var(--color-scrollbar-track);
      }

      // The phone row runs to the screen's edges.
      @include for-mobile {
        margin-inline: var(--gutter-half-negative);
        margin-block-end: var(--ni-0);
      }
    }

    // A share of the row, so a phone row shows four cells across.
    .cast-cell {
      flex: 0 0 var(--cast-cell-width-desktop-lg);
      min-width: var(--ni-0);

      @include for-tablet-lg {
        flex-basis: var(--cast-cell-width-tablet-lg);
      }

      @include for-tablet-sm {
        flex-basis: var(--cast-cell-width-tablet-sm);
      }

      @include for-mobile {
        flex-basis: var(--cast-cell-width-mobile);
      }
    }

    // Drawn inside the box, so the scroller's clipped edge keeps the ring whole.
    .cast-link {
      position: relative;
      display: block;
      color: inherit;
      text-decoration: none;

      @include inset-focus-ring;
    }

    .cast-headshot {
      display: block;
      margin-inline-end: var(--ni-10);
      box-shadow: var(--shadow-poster-soft);
      transition: opacity var(--transition-default);

      @include for-mobile {
        margin-inline-end: var(--ni-0);
      }
    }

    .cast-titles {
      display: block;
      margin-block-end: var(--ni-5);
      margin-inline-end: var(--ni-10);
      text-align: center;

      @include for-mobile {
        padding-inline: var(--ni-5);
      }
    }

    // A line keeps its height empty, as a movie cell's episode line is.
    .cast-line {
      display: block;
      height: var(--line-height-card-subtitle);
      color: var(--color-text-muted);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-card-subtitle);
      font-weight: var(--font-weight-heading-light);
      line-height: var(--line-height-card-subtitle);
      transition: color var(--transition-default);
    }

    .cast-name {
      margin-block-start: var(--ni-5);
    }

    .cast-character {
      margin-block-start: var(--ni-1);
      color: var(--color-text-primary);
    }

    // A focused cell shows what hovering it shows.
    .cast-cells:focus-within {
      .cast-headshot {
        opacity: var(--cast-hover-dim-opacity);
      }

      .cast-line {
        color: var(--color-cast-text-dim);
      }

      .cast-cell:focus-within .cast-headshot {
        opacity: 1;
      }
    }

    @include for-mouse {
      .cast-cells:hover {
        .cast-headshot {
          opacity: var(--cast-hover-dim-opacity);
        }

        .cast-line {
          color: var(--color-cast-text-dim);
        }

        .cast-cell:hover .cast-headshot {
          opacity: 1;
        }
      }
    }
  }
</style>
