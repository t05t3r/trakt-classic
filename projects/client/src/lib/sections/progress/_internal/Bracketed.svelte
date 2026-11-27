<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

{m.text_bracketed_value_open()}{@render children()}{m.text_bracketed_value_close()}
