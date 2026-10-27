<script lang="ts">
  import { toRelativeHumanTime } from '$lib/utils/formatting/date/toRelativeHumanTime.ts';

  const { date }: { date: Date } = $props();

  const relative = $derived(toRelativeHumanTime({ date, now: new Date() }));
</script>

{#if relative}
  <span class="trakt-relative-date">{relative}</span>
{/if}
