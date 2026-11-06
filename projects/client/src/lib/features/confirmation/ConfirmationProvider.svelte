<script lang="ts">
  import ConfirmationDialog from "./_internal/ConfirmationDialog.svelte";
  import { createConfirmationContext } from "./_internal/createConfirmationContext";
  import { mapToConfirmation } from "./_internal/mapToConfirmation.ts";
  import type { Snippet } from "svelte";

  const { children }: { children: Snippet } = $props();

  const { activeConfirmation, hideConfirmation } = createConfirmationContext();

  const settle = (answer: "onConfirm" | "onAlternate" | "onCancel") => {
    const request = activeConfirmation.value;
    hideConfirmation();

    request?.[answer]?.();
  };
</script>

{@render children()}

{#if $activeConfirmation}
  <ConfirmationDialog
    {...mapToConfirmation($activeConfirmation)}
    onConfirm={() => settle("onConfirm")}
    onAlternate={() => settle("onAlternate")}
    onCancel={() => settle("onCancel")}
  />
{/if}
