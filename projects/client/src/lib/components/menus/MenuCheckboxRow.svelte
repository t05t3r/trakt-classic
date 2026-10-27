<script lang="ts">
  import MenuRow from './MenuRow.svelte';
  import type { MenuCheckboxRowProps } from './_internal/MenuCheckboxRowProps.ts';

  const { checked, onToggle, children }: MenuCheckboxRowProps = $props();
</script>

<button
  type="button"
  role="checkbox"
  class="trakt-menu-checkbox-row"
  aria-checked={checked === true}
  aria-disabled={checked === 'unknown' ? 'true' : undefined}
  onclick={onToggle}
>
  <MenuRow {checked}>{@render children()}</MenuRow>
</button>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-menu-checkbox-row {
    display: block;
    width: 100%;
    padding: var(--ni-0);
    border: none;
    background: none;
    color: inherit;
    text-align: start;
    cursor: pointer;

    &:focus-visible {
      outline: none;
      background: var(--color-surface-raised);
    }

    @include for-mouse {
      &:hover {
        background: var(--color-surface-raised);
      }
    }
  }
</style>
