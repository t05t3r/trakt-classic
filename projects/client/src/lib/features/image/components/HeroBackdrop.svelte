<script lang="ts">
  import { isPlaceholder } from '$lib/features/image/isPlaceholder.ts';
  import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
  import BackdropImage from './_internal/BackdropImage.svelte';
  import type { BackdropPosition } from './_internal/BackdropPosition.ts';

  const { src, position }: { src: ImageUrl | Nil; position: BackdropPosition } =
    $props();
</script>

{#if src && !isPlaceholder(src)}
  <!-- A new backdrop fades in from black, as the first one did. -->
  {#key src}
    <BackdropImage {src} {position} />
  {/key}
{/if}
