<script lang="ts">
  import { resolve } from '$app/paths';
  import SectionHeader from '$lib/components/headers/SectionHeader.svelte';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import type { ListTitleBarProps } from './ListTitleBarProps.ts';

  const { title, href, titleId, loading }: ListTitleBarProps = $props();
</script>

{#snippet titleLink()}
  <a class="list-title-link" href={resolve(href)}>{title}</a>
{/snippet}

<div class="trakt-list-title-bar">
  <ContainerPage>
    <SectionHeader
      title={titleLink}
      {titleId}
      {loading}
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
  }
</style>
