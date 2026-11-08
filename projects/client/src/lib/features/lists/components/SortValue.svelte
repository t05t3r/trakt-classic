<script lang="ts">
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import type { SortValueProps } from './_internal/SortValueProps.ts';

  const { value }: SortValueProps = $props();

  const hydrated = useHydrated();
</script>

<!-- An instant's day is the viewer's, which the server cannot know. -->
{#if value?.kind === 'date' && (!value.zoned || $hydrated)}
  <FormattedDate date={value.date} pattern={value.pattern} swap={false} />
{:else if value?.kind === 'minutes'}
  <HumanizedMinutes minutes={value.minutes} swap={false} />
{:else if value?.kind === 'text'}
  {value.text}
{/if}
