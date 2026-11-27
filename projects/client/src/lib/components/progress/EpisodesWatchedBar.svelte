<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import type { EpisodesWatchedBarProps } from './_internal/EpisodesWatchedBarProps.ts';
  import TickProgressBar from './TickProgressBar.svelte';

  const { completed, total, size, segments, highlight }:
    EpisodesWatchedBarProps = $props();
</script>

<TickProgressBar
  value={completed}
  {total}
  {size}
  {segments}
  {highlight}
  label={m.progress_label_episodes_watched({ completed, total })}
/>
