<script lang="ts">
  import { resolve } from '$app/paths';
  import RelativeDate from '$lib/components/stats/RelativeDate.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconHistory from '@tabler/icons-svelte/icons/history';
  import type { LastWatchedPillProps } from './LastWatchedPillProps.ts';

  const { row, lastWatchedAt }: LastWatchedPillProps = $props();

  const hydrated = useHydrated();

  // A show never played has no last episode to name.
  const lastEpisode = $derived(row.plays > 0 ? row.lastEpisode : null);
  // How long ago reads the viewer's clock, which the server cannot know.
  const watchedAt = $derived($hydrated ? lastWatchedAt : null);

  // Joined in code, so a part the episode lacks leaves no space behind.
  function episodeName(episode: EpisodeEntry) {
    const absolute = episode.numberAbs != null
      ? `${m.text_bracketed_value_open()}${episode.numberAbs}${m.text_bracketed_value_close()}`
      : '';
    const title = episode.title
      ? m.text_progress_last_episode_title({ title: episode.title })
      : '';

    return [absolute, title].filter((part) => part !== '').join(' ');
  }
</script>

{#if lastEpisode}
  {@const name = episodeName(lastEpisode)}
  <a
    class="trakt-last-watched-pill"
    href={resolve(
      UrlBuilder.episode(row.show.slug, lastEpisode.season, lastEpisode.number),
    )}
  >
    <IconHistory class="last-watched-glyph" aria-hidden="true" />
    <span class="pill-text">
      {m.text_progress_last_watched()}
      <strong>{episodeSxeLabel(lastEpisode)}</strong>
      {#if name}
        <span class="pill-title">{name}</span>
      {/if}
      {#if watchedAt}
        <RelativeDate date={watchedAt} />
      {/if}
    </span>
  </a>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-last-watched-pill {
    @include inherited-link-style;

    display: flex;
    column-gap: var(--ni-6);
    align-items: center;
    width: fit-content;
    margin-block-start: var(--ni-10);
    padding-block: var(--ni-6);
    padding-inline: var(--ni-12);
    border: var(--ni-1) solid var(--color-link);
    color: var(--color-link);
    font-size: var(--font-size-button);

    strong {
      @include heavy-heading-font;
    }

    :global(.last-watched-glyph) {
      flex: none;
      width: var(--icon-size-last-watched);
      height: var(--icon-size-last-watched);
      stroke-width: var(--icon-stroke-chrome);
    }

    // As wide as the row, the episode's title giving way first.
    @include for-mobile {
      width: auto;

      .pill-text {
        display: flex;
        column-gap: var(--ni-4);
        min-width: var(--ni-0);
        white-space: nowrap;
      }

      .pill-title {
        min-width: var(--ni-0);
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
</style>
