<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import type { DateFormProps } from './DateFormProps.ts';

  const {
    children,
    dismissLabel,
    onDismiss,
    onSubmit,
    noValidate,
  }: DateFormProps = $props();

  const submit = (
    event: SubmitEvent & { currentTarget: HTMLFormElement },
  ) => {
    event.preventDefault();
    onSubmit(event.currentTarget);
  };
</script>

<form class="trakt-date-form" novalidate={noValidate} onsubmit={submit}>
  {@render children()}

  <button class="date-form-apply" type="submit">
    {m.button_text_apply()}
  </button>
  <button class="date-form-dismiss" type="button" onclick={onDismiss}>
    {dismissLabel}
  </button>
</form>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-date-form {
    padding-block: var(--popover-padding-block);
    padding-inline: var(--popover-padding-inline);

    .date-form-apply {
      padding-block: var(--ni-6);
      padding-inline: var(--ni-12);

      border: var(--ni-1) solid transparent;
      border-radius: var(--border-radius-none);
      background: var(--color-accent);
      color: var(--color-text-primary);
      font-family: var(--font-family-body);
      font-size: var(--font-size-button);
      line-height: var(--line-height-text);
      cursor: pointer;

      @include for-mouse {
        &:hover {
          background: var(--color-accent-hover);
        }
      }
    }

    .date-form-dismiss {
      @include link-button;

      margin-inline-start: var(--ni-15);
      font-family: var(--font-family-body);
      font-size: var(--font-size-small);
    }
  }
</style>
