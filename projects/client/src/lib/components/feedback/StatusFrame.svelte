<script lang="ts" generics="T">
  import StatusBody from './_internal/StatusBody.svelte';
  import PendingSpinner from './PendingSpinner.svelte';
  import type { StatusFrameProps } from './StatusFrameProps.ts';

  const { status, empty, children, describedBy }: StatusFrameProps<T> =
    $props();

  let frame: HTMLElement | undefined = $state();
</script>

<div
  class="trakt-status-frame"
  aria-busy={status.kind === 'loading'}
  bind:this={frame}
>
  <StatusBody {status} {empty} {children} {describedBy} fallback={frame}>
    {#snippet pending()}
      <div class="status-frame-pending"><PendingSpinner /></div>
    {/snippet}
  </StatusBody>
</div>

<style lang="scss">
  // The caller may set the spinner's gap above with `--status-frame-pending-offset`.
  .trakt-status-frame {
    // It takes focus only as a retry's fallback, and a ring would outline its whole content.
    &:focus {
      outline: none;
    }

    .status-frame-pending {
      --pending-spinner-size: var(--icon-size-heading);
      --pending-spinner-stroke: var(--icon-stroke-chrome);

      margin-block-start: var(--status-frame-pending-offset, var(--ni-0));
    }
  }
</style>
