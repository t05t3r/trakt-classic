<script lang="ts">
  import type { DateFieldProps } from './DateFieldProps.ts';

  let {
    label,
    type,
    value = $bindable(),
    min,
    max,
    required = false,
  }: DateFieldProps = $props();
</script>

<label class="trakt-date-field">
  <span class="date-field-label">{label}</span>
  <span class="date-field-box">
    <input class="date-field-input" {type} {min} {max} {required} bind:value />
  </span>
</label>

<style lang="scss">
  .trakt-date-field {
    display: block;

    .date-field-label {
      display: block;
      color: var(--color-text-muted);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-label);
      font-weight: var(--font-weight-heading);
      text-transform: uppercase;
    }

    // iOS Safari adds a date input's own padding and border to its size, so this box carries them.
    .date-field-box {
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

    .date-field-input {
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
  }
</style>
