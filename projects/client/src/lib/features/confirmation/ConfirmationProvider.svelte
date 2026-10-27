<script lang="ts">
  import ConfirmationDialog from "./_internal/ConfirmationDialog.svelte";
  import { createConfirmationContext } from "./_internal/createConfirmationContext";
  import { mapToConfirmation } from "./_internal/mapToConfirmation.ts";
  import type { Snippet } from "svelte";

  const { children }: { children: Snippet } = $props();

  const { activeConfirmation, hideConfirmation } = createConfirmationContext();

  const settle = (isConfirmed: boolean) => {
    const request = activeConfirmation.value;
    hideConfirmation();

    if (isConfirmed) {
      request?.onConfirm();
      return;
    }

    request?.onCancel?.();
  };
</script>

{@render children()}

{#if $activeConfirmation}
  <ConfirmationDialog
    {...mapToConfirmation($activeConfirmation)}
    onConfirm={() => settle(true)}
    onCancel={() => settle(false)}
  />
{/if}
