<script lang="ts">
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
  import type { DatePattern } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import CaptionTag from './CaptionTag.svelte';

  const { date, pattern }: { date: Date; pattern: DatePattern } = $props();

  const hydrated = useHydrated();
</script>

<!-- The time is the viewer's, which the server cannot know. -->
{#if $hydrated && isKnownDate(date)}
  <CaptionTag>
    <FormattedDate {date} {pattern} />
  </CaptionTag>
{/if}
