<script lang="ts">
  import Toast from '$lib/components/feedback/Toast.svelte';
  import {
    type ToastEntry,
    useToasts,
  } from '$lib/features/action-toast/stores/useToasts.ts';
  import { holdFallbackFocus } from '$lib/utils/focus/holdFallbackFocus.ts';
  import { onDestroy, tick } from 'svelte';

  const { toasts, dismiss } = useToasts();

  let entries: ReadonlyArray<ToastEntry> = $state.raw([]);
  let region: HTMLDivElement | undefined = $state();
  let priorFocus: HTMLElement | undefined;

  // Each strip's only button is its dismiss button.
  const dismissButtons = () =>
    Array.from(region?.querySelectorAll('button') ?? []);

  const recordPriorFocus = ({ relatedTarget }: FocusEvent) => {
    if (relatedTarget instanceof Node && region?.contains(relatedTarget)) return;

    // Body holds focus only when nothing else does, so it is no element to return to.
    const isElement =
      relatedTarget instanceof HTMLElement && relatedTarget !== document.body;
    priorFocus = isElement ? relatedTarget : undefined;
  };

  const focusOutside = () => {
    priorFocus?.focus({ preventScroll: true });
    if (document.activeElement !== document.body) return;

    const main = document.querySelector('main');
    if (main) holdFallbackFocus(main);
  };

  const refocus = async (index: number) => {
    await tick();
    // Focus anywhere but body stayed or was moved there on purpose.
    if (document.activeElement !== document.body) return;

    const buttons = dismissButtons();
    if (buttons.length === 0) return focusOutside();

    // Focus arrives from body, but moving between strips is no entry into the region.
    const kept = priorFocus;
    buttons.at(Math.min(index, buttons.length - 1))?.focus();
    priorFocus = kept;
  };

  // The focused button is read before the update, while the leaving strip still holds focus.
  const subscription = toasts.subscribe((next) => {
    const buttons = dismissButtons();
    const focused = buttons.find((button) => button === document.activeElement);
    entries = next;
    if (!focused) return;

    void refocus(buttons.indexOf(focused));
  });
  onDestroy(() => subscription.unsubscribe());
</script>

<div
  bind:this={region}
  class="trakt-toast-region"
  onfocusin={recordPriorFocus}
  role="status"
  aria-atomic="false"
>
  {#each entries as toast (toast.id)}
    <Toast message={toast.message} onDismiss={() => dismiss(toast.id)} />
  {/each}
</div>

<style lang="scss">
  .trakt-toast-region {
    position: fixed;
    inset-block-start: var(--header-height);
    inset-inline: var(--ni-0);
    z-index: var(--layer-top);
  }
</style>
