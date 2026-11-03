<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
</script>

<span class="trakt-private-label">{m.text_private()}</span>

<style lang="scss">
  .trakt-private-label {
    display: inline-block;
    margin-block-end: var(--private-label-margin-block-end);
    margin-inline-start: var(--private-label-margin-inline-start);
    padding-block: var(--private-label-padding-block);
    padding-inline: var(--private-label-padding-inline);
    background-color: var(--color-private-label-background);
    color: var(--color-text-primary);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-private-label);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--private-label-letter-spacing);
    line-height: var(--line-height-tag);
    text-transform: uppercase;
  }
</style>
