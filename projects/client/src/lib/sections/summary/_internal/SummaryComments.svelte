<script lang="ts">
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import * as m from '$lib/features/i18n/messages.ts';

  const { status }: { status: SectionStatus<number> } = $props();
</script>

<SectionState
  header={{ title: m.text_comments_title() }}
  {status}
  emptyText={m.text_comments_empty()}
/>
