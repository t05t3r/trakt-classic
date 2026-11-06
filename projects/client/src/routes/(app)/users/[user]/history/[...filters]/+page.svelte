<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import HistoryPage from '$lib/sections/history/HistoryPage.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<svelte:head>
  <title>{m.page_title_history()} · {m.text_app_name()}</title>
</svelte:head>

<HistoryPage filters={params.filters} />
