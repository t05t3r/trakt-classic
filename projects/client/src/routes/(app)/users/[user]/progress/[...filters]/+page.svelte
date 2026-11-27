<script lang="ts">
  import ProgressPage from '$lib/sections/progress/ProgressPage.svelte';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();
</script>

<ProgressPage filters={params.filters} />
