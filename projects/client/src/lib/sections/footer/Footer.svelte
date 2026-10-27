<script lang="ts">
  import MessageWithLink from '$lib/components/link/MessageWithLink.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
</script>

<footer class="trakt-footer">
  <ul class="footer-links" role="list">
    <li>
      <a
        class="footer-link"
        href="https://github.com/t05t3r/trakt-classic"
        target="_blank"
        rel="noopener noreferrer"
      >
        {m.text_footer_source()}
      </a>
    </li>
  </ul>
  <p class="footer-attribution">
    <MessageWithLink
      message={m.text_powered_by_trakt_long()}
      href="https://trakt.tv"
    />
  </p>
</footer>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-footer {
    padding: var(--gutter);
    background: var(--color-footer-background);
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-heading);

    .footer-links {
      display: flex;
      margin: var(--ni-0);
      padding: var(--ni-0);
      list-style: none;
    }

    .footer-link {
      color: var(--color-text-primary);
      font-size: var(--font-size-small);
      text-decoration: none;
      text-transform: uppercase;
      transition: color var(--transition-default);

      &:hover {
        color: var(--color-link);
      }
    }

    .footer-attribution {
      margin-block-start: var(--gutter);
      color: var(--color-text-footer);
      font-size: var(--font-size-label);
      // The global paragraph rule would otherwise reset the footer's weight.
      font-weight: inherit;
    }

    @include for-mobile {
      padding: var(--ni-15);
    }
  }
</style>
