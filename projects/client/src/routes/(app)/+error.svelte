<script lang="ts">
  import { page } from '$app/state';
  import ErrorPage from '$lib/sections/errors/ErrorPage.svelte';
</script>

<ErrorPage status={page.status} frame="shell" />
