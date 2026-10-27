<script lang="ts">
  import LoginPage from '$lib/sections/login/LoginPage.svelte';

  const { data } = $props();
</script>

<LoginPage returnTo={data.returnTo} error={data.error} />
