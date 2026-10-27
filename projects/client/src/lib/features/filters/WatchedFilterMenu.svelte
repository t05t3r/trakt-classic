<script lang="ts">
  import DropdownButton from '$lib/components/buttons/DropdownButton.svelte';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import MenuRadioGroup from '$lib/components/menus/MenuRadioGroup.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useMedia } from '$lib/stores/css/useMedia.ts';
  import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
  import IconEye from '@tabler/icons-svelte/icons/eye';
  import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';

  const {
    value,
    onValueChange,
  }: {
    value: WatchedFilter | null;
    onValueChange: (value: WatchedFilter | null) => void;
  } = $props();

  const isNarrow = useMedia(WELL_KNOWN_MEDIA_QUERY.tabletSmallAndBelow);
  const isActive = $derived(value !== null);

  const isWatchedFilter = (next: string | null): next is WatchedFilter | null =>
    next === null || next === 'fade' || next === 'hide';

  const select = (next: string | null) => {
    if (!isWatchedFilter(next)) return;
    onValueChange(next);
  };
</script>

<Menu
  label={m.button_label_watched_filter()}
  align={$isNarrow ? 'end' : 'start'}
>
  {#snippet trigger({ props })}
    <DropdownButton
      {...props}
      label={m.button_label_watched_filter()}
      variant="icon"
      selected={isActive}
    >
      <span class="trakt-watched-filter-menu" class:is-struck={isActive}>
        <IconEye class="watched-filter-glyph" aria-hidden="true" />
        <span class="watched-filter-strike"></span>
      </span>
    </DropdownButton>
  {/snippet}

  <MenuRadioGroup {value} onValueChange={select}>
    <MenuItem radio="fade">{m.button_text_watched_fade()}</MenuItem>
    <MenuItem radio="hide">{m.button_text_watched_hide()}</MenuItem>
  </MenuRadioGroup>
</Menu>

<style lang="scss">
  .trakt-watched-filter-menu {
    position: relative;
    display: inline-flex;

    :global(.watched-filter-glyph) {
      width: var(--icon-size-chrome-eye);
      height: var(--icon-size-chrome-eye);
      stroke-width: var(--icon-stroke-chrome);
    }

    .watched-filter-strike {
      position: absolute;
      inset-block-start: 45%;
      inset-inline-start: var(--ni-0);
      width: 100%;
      height: var(--ni-1);
      background: var(--color-accent);
      opacity: 0;
      transform: rotate(-45deg);
      transition: opacity var(--transition-default);
    }

    &.is-struck .watched-filter-strike {
      opacity: 1;
    }
  }
</style>
