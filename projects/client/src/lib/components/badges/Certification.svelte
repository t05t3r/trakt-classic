<script lang="ts">
  import { toCertificationText } from './_internal/toCertificationText.ts';

  const { certification }: { certification: string } = $props();

  const description = $derived(toCertificationText(certification));
</script>

<span class="trakt-certification" title={description}>{certification}</span>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-certification {
    display: inline-block;
    margin-inline-start: var(--ni-10);
    padding: var(--ni-2) var(--ni-4) var(--ni-1);
    border: var(--border-thickness-xxs) solid var(--color-certification-border);
    border-radius: var(--border-radius-xxs);
    font-size: var(--font-size-tag);
    font-weight: var(--font-weight-heading);
    vertical-align: middle;
    transition:
      background-color var(--transition-default),
      color var(--transition-default);

    @include for-mouse {
      cursor: pointer;

      &:hover {
        background-color: var(--color-certification-background-hover);
        color: var(--color-certification-text-hover);
      }
    }
  }
</style>
