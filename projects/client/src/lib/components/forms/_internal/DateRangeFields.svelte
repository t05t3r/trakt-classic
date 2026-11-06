<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import DateField from './DateField.svelte';
  import DateForm from './DateForm.svelte';
  import type { DateRangeFieldsProps } from './DateRangeFieldsProps.ts';

  // With no max a date input allows a five-digit year, and day strings sort only with four digits.
  const MAX_DAY = '9999-12-31';

  const { value, onApply, onClear }: DateRangeFieldsProps = $props();

  // A close unmounts these fields, so what was typed never outlives the open popover.
  let start = $derived(value.start);
  let end = $derived(value.end);
</script>

<DateForm
  dismissLabel={m.button_text_clear()}
  onDismiss={onClear}
  onSubmit={() => onApply({ start, end })}
>
  <DateField
    label={m.label_date_start()}
    type="date"
    max={MAX_DAY}
    bind:value={start}
  />
  <DateField
    label={m.label_date_end()}
    type="date"
    max={MAX_DAY}
    bind:value={end}
  />
</DateForm>
