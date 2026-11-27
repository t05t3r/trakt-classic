<script lang="ts">
  import CaptionTag from '$lib/components/badges/CaptionTag.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import EpisodeFanartCard from '$lib/features/media-card/components/EpisodeFanartCard.svelte';
  import MediaFanartCard from '$lib/features/media-card/components/MediaFanartCard.svelte';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import { toMediaFanart } from '$lib/features/media-card/toMediaFanart.ts';
  import { toTranslatedStatus } from '$lib/utils/formatting/string/toTranslatedStatus.ts';
  import { hasEnded } from '$lib/utils/media/hasEnded.ts';
  import IconCircleCheckFilled from '@tabler/icons-svelte/icons/circle-check-filled';
  import type { ProgressRowCardProps } from './ProgressRowCardProps.ts';

  const { show, nextEpisode, isComplete }: ProgressRowCardProps = $props();

  // A show that has neither ended nor been canceled has more to come.
  const statusText = $derived(
    hasEnded(show.status)
      ? toTranslatedStatus(show.status)
      : m.tag_text_returning(),
  );
</script>

{#snippet caption()}
  <CaptionTag>{statusText}</CaptionTag>
{/snippet}

{#snippet caughtUp()}
  <span class="caught-up">
    <IconCircleCheckFilled class="caught-up-glyph" aria-hidden="true" />
    {m.text_progress_status_caught_up()}
  </span>
{/snippet}

<div class="trakt-progress-row-card">
  <!-- A caught-up show's next episode has not aired yet. -->
  {#if nextEpisode && !isComplete}
    <EpisodeFanartCard
      {show}
      episode={nextEpisode}
      withAirDate
      showLine="phone"
    />
  {:else}
    <MediaFanartCard
      card={toMediaCard({ type: 'show', show })}
      fanart={toMediaFanart(show)}
      {caption}
      status={isComplete ? caughtUp : undefined}
    />
  {/if}
</div>

<style lang="scss">
  .trakt-progress-row-card {
    // Seats the caption tags on the title, as Classic's progress card does.
    --caption-tag-margin-block-end: var(--ni-0);

    // Set as the strip's rating beside it.
    .caught-up {
      display: inline-flex;
      column-gap: var(--ni-5);
      align-items: center;
      font-family: var(--font-family-heading);
      font-size: var(--font-size-stat);
      font-weight: var(--font-weight-heading);
    }

    :global(.caught-up-glyph) {
      width: var(--icon-size-strip-heart-lg);
      height: var(--icon-size-strip-heart-lg);
      color: var(--color-action-watch);
    }
  }
</style>
