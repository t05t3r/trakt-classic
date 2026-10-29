<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import type { Attachment } from 'svelte/attachments';
  import EmptyState from './EmptyState.svelte';
  import type { SectionErrorProps } from './SectionErrorProps.ts';

  const { retry, fallback, describedBy }: SectionErrorProps = $props();

  const retention = createFocusRetention();

  // Remembered on the press, since a Safari click leaves the focus on the body.
  const retryInPlace = (button: HTMLButtonElement) => {
    retention.remember(button);
    retry();
  };

  // A pressed retry may unmount its own button, so the fallback holds the focus it drops.
  const holdFocusOnLeave: Attachment<HTMLButtonElement> = () => () =>
    retention.settle(fallback);
</script>

<EmptyState>
  {m.error_text_section_load()}
  <button
    type="button"
    class="section-error-retry"
    aria-describedby={describedBy}
    onclick={({ currentTarget }) => retryInPlace(currentTarget)}
    {@attach holdFocusOnLeave}
  >
    {m.button_text_retry()}
  </button>
</EmptyState>

<style lang="scss">
  .section-error-retry {
    padding: var(--ni-0);
    border: none;
    background: none;
    color: var(--color-link);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
