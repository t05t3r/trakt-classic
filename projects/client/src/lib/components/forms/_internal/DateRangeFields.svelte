<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import type { DateRangeFieldsProps } from './DateRangeFieldsProps.ts';

  // With no max a date input allows a five-digit year, and day strings sort only with four digits.
  const MAX_DAY = '9999-12-31';

  const { value, onApply, onClear }: DateRangeFieldsProps = $props();

  // A close unmounts these fields, so what was typed never outlives the open popover.
  let start = $derived(value.start);
  let end = $derived(value.end);

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    onApply({ start, end });
  };
</script>

<form class="trakt-date-range-fields" onsubmit={submit}>
  <label class="date-range-field">
    <span class="date-range-label">{m.label_date_start()}</span>
    <span class="date-range-box">
      <input
        class="date-range-input"
        type="date"
        max={MAX_DAY}
        bind:value={start}
      />
    </span>
  </label>
  <label class="date-range-field">
    <span class="date-range-label">{m.label_date_end()}</span>
    <span class="date-range-box">
      <input
        class="date-range-input"
        type="date"
        max={MAX_DAY}
        bind:value={end}
      />
    </span>
  </label>

  <button class="date-range-apply" type="submit">
    {m.button_text_apply()}
  </button>
  <button class="date-range-clear" type="button" onclick={onClear}>
    {m.button_text_clear()}
  </button>
</form>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-date-range-fields {
    padding-block: var(--popover-padding-block);
    padding-inline: var(--popover-padding-inline);

    .date-range-field {
      display: block;
    }

    .date-range-label {
      display: block;
      color: var(--color-text-muted);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-label);
      font-weight: var(--font-weight-heading);
      text-transform: uppercase;
    }

    // iOS Safari adds a date input's own padding and border to its size, so this box carries them.
    .date-range-box {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      block-size: var(--date-field-height);
      margin-block-end: var(--ni-10);
      padding-block: var(--ni-6);
      padding-inline: var(--ni-12);

      border: var(--ni-1) solid var(--color-border-strong);
      border-radius: var(--border-radius-none);
      background: var(--color-input-background);
      box-shadow: var(--shadow-inset-input);

      &:focus-within {
        outline: auto;
      }
    }

    .date-range-input {
      box-sizing: border-box;
      inline-size: 100%;
      min-inline-size: var(--ni-0);
      padding: var(--ni-0);

      border: none;
      outline: none;
      background: transparent;
      color: var(--color-text-tertiary);
      font-size: var(--font-size-button);

      &::-webkit-date-and-time-value {
        text-align: start;
      }
    }

    .date-range-apply {
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

    .date-range-clear {
      @include link-button;

      margin-inline-start: var(--ni-15);
      font-family: var(--font-family-body);
      font-size: var(--font-size-small);
    }
  }
</style>
