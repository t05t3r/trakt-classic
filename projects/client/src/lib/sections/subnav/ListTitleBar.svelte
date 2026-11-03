<script lang="ts">
  import { resolve } from '$app/paths';
  import SectionHeader from '$lib/components/headers/SectionHeader.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import IconSettings from '@tabler/icons-svelte/icons/settings';
  import type { ListTitleBarProps } from './ListTitleBarProps.ts';

  let {
    title,
    href,
    titleId,
    loading,
    open,
    panelId,
    ontoggle,
    gear = $bindable(),
  }: ListTitleBarProps = $props();
</script>

{#snippet titleLink()}
  <a class="list-title-link" href={resolve(href)}>{title}</a>
{/snippet}

{#snippet gearButton()}
  <button
    bind:this={gear}
    type="button"
    class="list-title-gear"
    aria-label={m.button_label_list_options()}
    aria-expanded={open}
    aria-controls={panelId}
    onclick={ontoggle}
  >
    <IconSettings class="list-title-gear-icon" aria-hidden="true" />
  </button>
{/snippet}

<div class="trakt-list-title-bar">
  <ContainerPage>
    <SectionHeader
      title={titleLink}
      {titleId}
      {loading}
      tools={gearButton}
      size="compact"
      spacing="compact"
    />
  </ContainerPage>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-list-title-bar {
    padding-block: var(--ni-4) var(--ni-6);
    background: var(--color-surface);
    color: var(--color-text-primary);

    @include for-mobile {
      padding-block: var(--ni-15) var(--ni-0);
    }

    .list-title-link {
      @include inherited-link-style;
    }

    // Wider screens show the toolbar's controls inline, so only a phone toggles them.
    .list-title-gear {
      display: none;
      margin-block-start: var(--ni-1);
      margin-inline-start: var(--ni-10);
      padding: var(--ni-0);
      border: none;
      background: none;
      color: inherit;
      cursor: pointer;

      @include for-mobile {
        display: flex;
      }
    }

    :global(.list-title-gear-icon) {
      width: var(--icon-size-subnav);
      height: var(--icon-size-subnav);
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
