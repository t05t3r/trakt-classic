<script lang="ts">
  import type { HistoryItem } from '$lib/features/history/HISTORY_ITEM_TYPES.ts';
  import type { HistoryEntry } from '$lib/features/history/stores/useHistoryItems.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import { toEpisodeScreenshot } from '$lib/features/media-card/toEpisodeScreenshot.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import IconX from '@tabler/icons-svelte/icons/x';
  import { filter } from 'rxjs';
  import type { HistoryItemBannerProps } from './_internal/HistoryItemBannerProps.ts';

  const LINES = {
    movie: m.text_history_item_movie,
    episode: m.text_history_item_episode,
    show: m.text_history_item_show,
    season: m.text_history_item_season,
  };

  const { item, entry, isEmpty, onClear }: HistoryItemBannerProps = $props();

  // Each page turn reads no entry until it lands, and the title stays through that.
  const held = fromRune(() => entry).pipe(filter((next) => next !== undefined));

  function toNames(current: HistoryItem, shown: HistoryEntry) {
    if (shown.type === 'movie') {
      return { name: shown.movie.title, year: shown.movie.year };
    }
    if (shown.type === 'show' || current.type === 'show') {
      return { name: shown.show.title, year: shown.show.year };
    }

    const { episode, show } = shown;
    const season = seasonLabel(episode.season);
    if (current.type === 'season') return { parent: show.title, name: season };

    return {
      parent: m.text_history_item_parent({ show: show.title, season }),
      name: `${episodeSxeLabel(episode)} ${episode.title}`,
      year: episode.year,
    };
  }

  // An episode shows its own screenshot; its show's and season's Plays, the show's fanart.
  // The slot is 120px wide at most, so every form takes the thumb.
  function toImage(current: HistoryItem, shown: HistoryEntry) {
    if (shown.type === 'movie') return shown.movie.cover.url.thumb;

    return current.type === 'episode' && shown.type === 'episode'
      ? toEpisodeScreenshot(shown).src
      : shown.show.cover.url.thumb;
  }

  const shown = $derived(isEmpty ? undefined : $held);
  const names = $derived(shown && toNames(item, shown));
</script>

<div class="trakt-history-item-banner">
  {#if !isEmpty}
    <div class="banner-image">
      <LazyImage src={shown && toImage(item, shown)} alt="" kind="fanart" />
    </div>
  {/if}
  <div class="banner-text">
    <span class="banner-line">
      {isEmpty ? m.text_history_item_empty() : LINES[item.type]()}
    </span>
    {#if names?.parent}
      <span class="banner-parent">{names.parent}</span>
    {/if}
    {#if names}
      <span class="banner-title">
        <span class="banner-name">{names.name}</span>
        {#if names.year}
          <span class="banner-year">{names.year}</span>
        {/if}
      </span>
    {/if}
  </div>
  <button
    type="button"
    class="banner-clear"
    title={m.link_label_history_all()}
    aria-label={m.link_label_history_all()}
    onclick={onClear}
  >
    <IconX class="banner-clear-glyph" aria-hidden="true" />
  </button>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-history-item-banner {
    display: flex;
    align-items: center;
    gap: var(--ni-20);

    .banner-image {
      flex-shrink: 0;
      overflow: hidden;
      width: var(--ni-120);
      border-radius: var(--border-radius-l);

      @include for-mobile {
        width: var(--ni-80);
      }
    }

    .banner-text {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: var(--ni-2);
      min-width: var(--ni-0);
    }

    .banner-line {
      color: var(--color-text-help);
      font-size: var(--font-size-tag);
      letter-spacing: var(--ni-1);
      text-transform: uppercase;
    }

    .banner-parent {
      font-size: var(--font-size-button);
    }

    .banner-name {
      font-family: var(--font-family-heading);
      font-size: var(--font-size-h3);
      font-weight: var(--font-weight-heading);
    }

    .banner-year {
      color: var(--color-text-help);
      font-size: var(--font-size-small);
    }

    .banner-clear {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: var(--ni-40);
      height: var(--ni-40);
      padding: var(--ni-0);
      border: var(--border-thickness-xxs) solid var(--color-border);
      border-radius: var(--border-radius-round);
      background: none;
      color: var(--color-text-help);
      cursor: pointer;
      transition: color var(--transition-default);

      @include for-mouse {
        &:hover {
          color: var(--color-text-primary);
        }
      }
    }

    :global(.banner-clear-glyph) {
      width: var(--ni-16);
      height: var(--ni-16);
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
