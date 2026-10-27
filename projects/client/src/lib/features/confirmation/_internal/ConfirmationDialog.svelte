<script lang="ts">
  import Modal from '$lib/components/dialogs/Modal.svelte';
  import type { ConfirmationDialogProps } from './ConfirmationDialogProps.ts';

  const {
    title,
    message,
    buttonText,
    cancelText,
    onConfirm,
    onCancel,
  }: ConfirmationDialogProps = $props();
</script>

<Modal {title} onClose={onCancel}>
  <p class="trakt-confirmation-dialog">{message}</p>

  {#snippet footer()}
    <button
      class="confirmation-button"
      data-variant="cancel"
      type="button"
      onclick={onCancel}
    >
      {cancelText}
    </button>
    <button
      class="confirmation-button"
      data-variant="confirm"
      type="button"
      onclick={onConfirm}
    >
      {buttonText}
    </button>
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
