<script lang="ts">
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<div class="trakt-container-page">
  {@render children()}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-container-page {
    box-sizing: border-box;
    width: 100%;
    margin-inline: auto;
    padding-inline: var(--gutter-half);

    @include for-tablet-sm {
      max-width: var(--container-sm);
    }

    @include for-tablet-lg {
      max-width: var(--container-md);
    }

    @include for-desktop-lg {
      max-width: var(--container-lg);
    }
  }
</style>
