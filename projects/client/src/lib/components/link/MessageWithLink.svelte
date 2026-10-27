<script lang="ts">
  const { message, href }: { message: string; href: `https://${string}` } =
    $props();

  function toLinkParts(text: string) {
    const parts = text.split(/(<\/?a>)/);

    if (parts.length !== 5) return null;
    if (parts.at(1) !== '<a>' || parts.at(3) !== '</a>') return null;

    const linkText = parts.at(2);
    if (!linkText) return null;

    return { beforeText: parts.at(0), linkText, afterText: parts.at(4) };
  }

  const linkParts = $derived(toLinkParts(message));
  const plainText = $derived(message.replace(/<\/?a>/g, ''));
</script>

{#if linkParts}
  {linkParts.beforeText}<a class="trakt-message-link" {href} rel="external"
    >{linkParts.linkText}</a
  >{linkParts.afterText}
{:else}
  {plainText}
{/if}

<style lang="scss">
  .trakt-message-link {
    color: inherit;

    &:hover {
      color: var(--color-link);
    }
  }
</style>
