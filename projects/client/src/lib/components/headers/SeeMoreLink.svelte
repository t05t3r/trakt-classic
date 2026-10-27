<script lang="ts">
  import { resolve } from '$app/paths';
  import IconCircleChevronRight from '@tabler/icons-svelte/icons/circle-chevron-right';
  import type { SeeMoreLinkProps } from './SeeMoreLinkProps.ts';

  const { href, label, context }: SeeMoreLinkProps = $props();

  const name = $derived(context ? `${label} ${context}` : label);
</script>

<!-- The name stays on phones too, where the text is hidden. -->
<a class="trakt-see-more-link" href={resolve(href)} aria-label={name}>
  <span class="see-more-text">{label}</span>
  <IconCircleChevronRight
    class="see-more-icon trakt-icon-directional"
    aria-hidden="true"
  />
</a>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-see-more-link {
    display: inline-flex;
    align-items: center;
    color: var(--color-text-help);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-heading-light);
    line-height: var(--line-height-see-more);
    text-decoration: none;
    text-transform: uppercase;
    transition: color var(--transition-default);

    @include for-mouse {
      &:hover {
        color: var(--color-link);
      }
    }

    .see-more-text {
      @include for-mobile {
        display: none;
      }
    }

    :global(.see-more-icon) {
      width: var(--icon-size-see-more);
      height: var(--icon-size-see-more);
      margin-inline-start: var(--ni-7);
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
