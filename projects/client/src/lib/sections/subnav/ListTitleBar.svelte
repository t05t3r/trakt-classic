<script lang="ts">
  import { resolve } from '$app/paths';
  import SectionHeader from '$lib/components/headers/SectionHeader.svelte';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import OptionsGear from './_internal/OptionsGear.svelte';
  import type { ListTitleBarProps } from './ListTitleBarProps.ts';

  const {
    title,
    href,
    titleId,
    loading,
    open,
    panelId,
    gearId,
    ontoggle,
  }: ListTitleBarProps = $props();
</script>

{#snippet titleLink()}
  <a class="list-title-link" href={resolve(href)}>{title}</a>
{/snippet}

{#snippet gearButton()}
  <OptionsGear id={gearId} {open} {panelId} {ontoggle} />
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
    --options-gear-margin-block: var(--ni-1) var(--ni-0);
    --options-gear-margin-inline: var(--ni-10) var(--ni-0);

    padding-block: var(--ni-4) var(--ni-6);
    background: var(--color-surface);
    color: var(--color-text-primary);

    @include for-mobile {
      padding-block: var(--ni-15) var(--ni-0);
    }

    .list-title-link {
      @include inherited-link-style;
    }
  }
</style>
