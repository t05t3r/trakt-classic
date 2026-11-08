<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';

  const { url }: { url: string } = $props();
</script>

<!-- KLIPY hosts the file and needn't learn which page shows it. -->
<img
  class="trakt-comment-gif"
  src={url}
  alt={m.image_alt_comment_gif()}
  loading="lazy"
  decoding="async"
  referrerpolicy="no-referrer"
/>

<style lang="scss">
  .trakt-comment-gif {
    display: block;
    max-width: 100%;
    height: var(--ni-200);
    border-radius: var(--border-radius-xxs);
    object-fit: cover;

    &:not(:first-child) {
      margin-block-start: var(--ni-10);
    }
  }
</style>
