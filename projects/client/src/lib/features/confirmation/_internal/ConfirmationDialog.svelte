<script lang="ts">
  import Modal from '$lib/components/dialogs/Modal.svelte';
  import type { ConfirmationDialogProps } from './ConfirmationDialogProps.ts';

  type DialogAction = {
    variant: 'confirm' | 'cancel';
    text: string;
    onclick: () => void;
  };

  const {
    title,
    message,
    buttonText,
    alternateText,
    cancelText,
    onConfirm,
    onAlternate,
    onCancel,
  }: ConfirmationDialogProps = $props();
</script>

{#snippet action({ variant, text, onclick }: DialogAction)}
  <button class="confirmation-button" data-variant={variant} type="button" {onclick}>
    {text}
  </button>
{/snippet}

<Modal {title} onClose={onCancel}>
  <p class="trakt-confirmation-dialog">{message}</p>

  {#snippet footer()}
    {#if alternateText}
      {@render action({ variant: 'confirm', text: buttonText, onclick: onConfirm })}
      {@render action({ variant: 'confirm', text: alternateText, onclick: onAlternate })}
      {@render action({ variant: 'cancel', text: cancelText, onclick: onCancel })}
    {:else}
      {@render action({ variant: 'cancel', text: cancelText, onclick: onCancel })}
      {@render action({ variant: 'confirm', text: buttonText, onclick: onConfirm })}
    {/if}
  {/snippet}
</Modal>

<style lang="scss">
  .trakt-confirmation-dialog {
    color: var(--color-text-primary);
  }

  .confirmation-button {
    padding-block: var(--ni-10);
    padding-inline: var(--ni-16);
    border: none;
    border-radius: var(--btn-radius);
    color: var(--color-text-primary);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-dialog-button);
    font-weight: var(--font-weight-heading-heavy);
    text-transform: uppercase;
    cursor: pointer;

    &[data-variant='confirm'] {
      background: var(--color-accent);

      &:hover {
        background: var(--color-accent-hover);
      }
    }

    &[data-variant='cancel'] {
      background: var(--color-button-cancel-background);

      &:hover {
        background: var(--color-button-cancel-background-hover);
      }
    }
  }
</style>
