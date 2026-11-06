<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import RatingsPage from '$lib/sections/ratings/RatingsPage.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<svelte:head>
  <title>{m.page_title_ratings()} · {m.text_app_name()}</title>
</svelte:head>

<RatingsPage filters={params.filters} />
