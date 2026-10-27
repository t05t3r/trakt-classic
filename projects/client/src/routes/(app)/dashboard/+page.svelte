<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import DashboardPage from '$lib/sections/dashboard/DashboardPage.svelte';
</script>

<svelte:head>
  <title>{m.text_dashboard()} · {m.text_app_name()}</title>
</svelte:head>

<DashboardPage />
