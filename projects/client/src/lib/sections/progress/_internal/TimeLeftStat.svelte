<script lang="ts">
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';
  import IconHourglass from '@tabler/icons-svelte/icons/hourglass';
  import Bracketed from './Bracketed.svelte';
  import type { TimeLeftStatProps } from './TimeLeftStatProps.ts';

  const { completed, total, minutes, swap = true, hint }: TimeLeftStatProps =
    $props();

  const remaining = $derived(Math.max(total - completed, 0));
  const episodes = $derived(
    countText.of({ count: remaining, unit: 'watchProgressEpisodes' }),
  );
</script>

{#snippet timeLeft()}
  <!-- Trakt may give no time, and a stat reading 0m would claim one. -->
  {#if nonNegativeFinite(minutes) > 0}
    <HumanizedMinutes {minutes} {swap} />
    <Bracketed>{episodes}</Bracketed>
  {:else}
    {episodes}
  {/if}
{/snippet}

{#if remaining > 0}
  <CountStat
    icon={IconHourglass}
    variant="row"
    value={timeLeft}
    label={m.text_progress_stat_left()}
    {hint}
  />
{/if}
