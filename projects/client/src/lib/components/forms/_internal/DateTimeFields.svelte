<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import { formatLocalDateTime } from '$lib/utils/date/formatLocalDateTime.ts';
  import DateField from './DateField.svelte';
  import DateForm from './DateForm.svelte';
  import type { DateTimeFieldsProps } from './DateTimeFieldsProps.ts';

  // A part-typed year such as 0202 is a valid date, so the field needs a floor.
  const MIN_TIME = '1900-01-01T00:00';

  const { label, onApply, onCancel }: DateTimeFieldsProps = $props();

  // Mounted per open, so the limit and the default are this open's minute.
  const max = formatLocalDateTime(new Date());
  let value = $state(max);

  // max stands still while the field stays open, so the form skips the browser's check and this is the only one; an empty value fails it too.
  const submit = (form: HTMLFormElement) => {
    const at = new Date(value);
    if (!(at >= new Date(MIN_TIME) && at <= new Date())) {
      form.reportValidity();
      return;
    }

    onApply(at);
  };
</script>

<DateForm
  dismissLabel={m.button_text_cancel()}
  onDismiss={onCancel}
  onSubmit={submit}
  noValidate
>
  <DateField
    {label}
    type="datetime-local"
    min={MIN_TIME}
    {max}
    required
    bind:value
  />
</DateForm>
