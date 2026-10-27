<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { isInjectedScriptError } from '$lib/features/errors/_internal/isInjectedScriptError.ts';
  import { EXTENSION_PROTOCOLS } from '$lib/features/errors/constants/index.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
  let unexpectedError = $state<Error | undefined>();

  afterNavigate(() => {
    unexpectedError = undefined;
  });
</script>

<svelte:window
  onerror={(event) => {
    const caught = event.error;
    if (!(caught && caught instanceof Error)) return;

    // Frames from our own code always reference the app's hostname.
    const isExternalNoise = !caught.stack?.includes(window.location.hostname) ||
      isInjectedScriptError(caught) ||
      EXTENSION_PROTOCOLS.some((protocol) => caught.stack?.includes(protocol));
    if (isExternalNoise) return;

    // Popup blockers and privacy settings raise these; nothing to act on.
    const message = caught.message.toLowerCase();
    if (
      caught.name === 'SecurityError' &&
      (message.includes('blocked a frame') ||
        message.includes('cross-origin object'))
    ) {
      return;
    }

    // No error-reporting service here, so an in-page alert is the only report.
    unexpectedError = caught;
  }}
/>

{#if unexpectedError}
  <section role="alert">
    <p>{m.error_text_unexpected_error_short()}</p>
  </section>
{:else}
  {@render children()}
{/if}
