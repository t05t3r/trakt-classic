<script lang="ts">
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import CommentsBlock from '$lib/features/comments/components/CommentsBlock.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { SummaryCommentsProps } from './SummaryCommentsProps.ts';

  const { status, target, media, progress }: SummaryCommentsProps = $props();
</script>

<div class="trakt-summary-comments">
  <SectionState
    header={{ title: m.text_comments_title() }}
    {status}
    emptyText={m.text_comments_empty()}
  >
    <!-- Keyed, since the block reads its Target once and the page stays mounted across Targets. -->
    {#key media.id}
      <CommentsBlock {target} {media} {progress} />
    {/key}
  </SectionState>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  // On phones Classic holds the next section 20px further off, whatever this one shows.
  .trakt-summary-comments {
    @include for-mobile {
      padding-block-end: var(--ni-20);
    }
  }
</style>
