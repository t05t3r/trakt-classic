<script lang="ts">
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { SeasonRef } from '$lib/requests/models/ShowProgressDetail.ts';
  import IconBan from '@tabler/icons-svelte/icons/ban';
  import IconDots from '@tabler/icons-svelte/icons/dots';
  import IconEye from '@tabler/icons-svelte/icons/eye';
  import type { SeasonMenuProps } from './SeasonMenuProps.ts';

  const { number, isHidden, hides, isUpdating, onhide, onunhide }:
    SeasonMenuProps = $props();

  let control = $state<HTMLElement>();

  const hide = (seasons: ReadonlyArray<SeasonRef>) =>
    onhide({ seasons, trigger: control });

  const label = $derived(m.button_label_season_actions({ season: number }));
  const isInert = $derived(isUpdating || !hides);
</script>

{#snippet eyeGlyph()}<IconEye />{/snippet}
{#snippet banGlyph()}<IconBan />{/snippet}

<Menu {label} {isInert}>
  {#snippet trigger({ props })}
    <!-- After the spread, so the menu's untyped trigger props cannot override them. -->
    <button
      {...props}
      bind:this={control}
      type="button"
      class="trakt-season-menu"
      class:is-inert={isInert}
      aria-label={label}
      {@attach hint(() => ({ content: label }))}
    >
      <IconDots class="season-menu-glyph" aria-hidden="true" />
    </button>
  {/snippet}

  {#if hides && isHidden}
    <MenuItem glyph={eyeGlyph} onSelect={() => onunhide([hides.season])}>
      {m.button_text_unhide_season({ season: number })}
    </MenuItem>
  {:else if hides}
    <MenuItem glyph={banGlyph} onSelect={() => hide([hides.season])}>
      {m.button_text_hide_season({ season: number })}
    </MenuItem>
    {#if hides.later.length > 0}
      <MenuItem glyph={banGlyph} onSelect={() => hide([hides.season, ...hides.later])}>
        {m.button_text_hide_season_and_later({ season: number })}
      </MenuItem>
      <MenuItem glyph={banGlyph} onSelect={() => hide(hides.later)}>
        {m.button_text_hide_seasons_after({ season: number })}
      </MenuItem>
    {/if}
  {/if}
</Menu>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-season-menu {
    @include link-button;

    display: inline-flex;
    flex: none;
    color: var(--color-text-muted);

    :global(.season-menu-glyph) {
      width: var(--icon-size-seasons-box);
      height: var(--icon-size-seasons-box);
    }

    &.is-inert {
      @include blocked-control;
    }

    @include for-mouse {
      &:not(.is-inert):hover {
        color: var(--color-text-primary);
      }
    }
  }
</style>
