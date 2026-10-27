<script lang="ts">
  import { resolve } from '$app/paths';
  import EmptyState from '$lib/components/feedback/EmptyState.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

  const { status, frame }: { status: number; frame: 'shell' | 'bare' } =
    $props();

  const isNotFound = $derived(status === 404);
  const title = $derived(
    isNotFound ? m.error_text_not_found_title() : m.error_text_generic_title(),
  );
  const help = $derived(
    isNotFound ? m.error_text_not_found_help() : m.error_text_generic_help(),
  );
</script>

<svelte:head>
  <title>{title} · {m.text_app_name()}</title>
</svelte:head>

<section
  class="trakt-error-page"
  data-frame={frame}
  aria-labelledby="error-page-title"
>
  <ContainerPage>
    <h2 id="error-page-title">{title}</h2>
    <EmptyState>
      {help}
      <a
        class="error-page-link"
        href={resolve(
          frame === 'shell' ? UrlBuilder.dashboard() : UrlBuilder.landing(),
        )}
      >
        {m.button_text_go_to_dashboard()}
      </a>
    </EmptyState>
  </ContainerPage>
</section>

<style lang="scss">
  .trakt-error-page {
    padding-block-end: var(--gutter);
    background: var(--color-surface);

    &[data-frame='shell'] {
      padding-block-start: calc(var(--ni-30) + var(--header-height));
    }

    &[data-frame='bare'] {
      padding-block-start: var(--login-card-offset);
    }

    h2 {
      margin-block: var(--ni-20) var(--ni-10);
      color: var(--color-text-primary);
    }

    .error-page-link {
      color: var(--color-link);
    }
  }
</style>
