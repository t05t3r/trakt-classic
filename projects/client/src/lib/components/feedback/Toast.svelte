<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import IconX from '@tabler/icons-svelte/icons/x';

  const { message, onDismiss }: { message: string; onDismiss: () => void } =
    $props();
</script>

<div class="trakt-toast">
  <p class="toast-message">{message}</p>
  <button
    class="toast-dismiss"
    type="button"
    aria-label={m.button_label_dismiss()}
    onclick={onDismiss}
  >
    <IconX class="toast-dismiss-glyph" aria-hidden="true" />
  </button>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-toast {
    display: flex;
    align-items: center;
    padding-block: var(--ni-10);
    padding-inline: var(--ni-20);
    border-inline-start: var(--ni-3) solid var(--color-danger);
    background: var(--color-surface-menu);
    color: var(--color-text-primary);
    font-family: var(--font-family-body);
    font-size: var(--font-size-text);
    line-height: var(--line-height-text);

    &:not(:first-child) {
      border-block-start: var(--ni-1) solid var(--color-border);
    }

    @include for-mobile {
      padding-inline: var(--ni-16);
    }

    .toast-message {
      flex-grow: 1;
      margin: var(--ni-0);
    }

    .toast-dismiss {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: var(--ni-24);
      height: var(--ni-24);
      padding: var(--ni-0);
      border: none;
      background: none;
      color: inherit;
      cursor: pointer;
    }

    :global(.toast-dismiss-glyph) {
      width: var(--ni-16);
      height: var(--ni-16);
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
