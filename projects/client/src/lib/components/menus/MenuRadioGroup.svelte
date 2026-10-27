<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { MenuRadioGroupProps } from './_internal/MenuRadioGroupProps.ts';

  const { value, onValueChange, children }: MenuRadioGroupProps = $props();

  // bits-ui reports the checked row's own value again when it is selected.
  const select = (next: string) => onValueChange(next === value ? null : next);
</script>

<!-- The caller owns the value: a select reports it and never sets it here. -->
<DropdownMenu.RadioGroup bind:value={() => value ?? '', select}>
  {@render children()}
</DropdownMenu.RadioGroup>
