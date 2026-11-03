<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import BuiltInListPage from '$lib/sections/lists/BuiltInListPage.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<svelte:head>
  <title>{m.page_title_favorites()} · {m.text_app_name()}</title>
</svelte:head>

<BuiltInListPage list="favorites" slug={params.user} />
