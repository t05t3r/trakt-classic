<script lang="ts">
  import ClampedText from '$lib/components/text/ClampedText.svelte';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';

  const { text }: { text: string } = $props();
</script>

<div class="trakt-list-description">
  <ContainerPage>
    <div class="list-description-text">
      <ClampedText>
        <p class="list-description-paragraph">{text}</p>
      </ClampedText>
    </div>
  </ContainerPage>
</div>

<style lang="scss">
  .trakt-list-description {
    --clamp-shade-color: var(--color-surface-list-description);

    background: var(--color-surface-list-description);
    color: var(--color-text-primary);
    font-size: var(--font-size-small);
    line-height: var(--line-height-text);

    .list-description-text {
      padding-block-start: var(--ni-10);
    }

    .list-description-paragraph {
      margin-block: var(--ni-0) var(--ni-10);
      margin-inline: var(--ni-0);
    }
  }
</style>
