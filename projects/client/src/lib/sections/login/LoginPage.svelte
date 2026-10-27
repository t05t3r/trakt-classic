<script lang="ts">
  import { resolve } from '$app/paths';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { LandingError } from '$lib/features/auth/models/LandingError.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

  const { returnTo, error }: { returnTo: string; error: LandingError | null } =
    $props();

  const errorMessages = {
    denied: m.error_text_auth_denied,
    state: m.error_text_auth_state,
    exchange: m.error_text_auth_exchange,
    rate_limited: m.error_text_auth_rate_limited,
    expired: m.error_text_auth_expired,
  } satisfies Record<LandingError, () => string>;
</script>

<svelte:head>
  <title>{m.page_title_sign_in()} · {m.text_app_name()}</title>
</svelte:head>

<main class="trakt-login-page">
  <section class="login-card" aria-labelledby="login-title">
    <h1 id="login-title" class="bold">{m.text_app_name()}</h1>
    <p class="help">{m.text_sign_in_help()}</p>
    {#if error !== null}
      <p class="error" role="alert">{errorMessages[error]()}</p>
    {/if}
    <a class="sign-in" data-variant="primary" href={resolve(UrlBuilder.auth.login({ returnTo }))} data-sveltekit-reload>
      <span class="bold">{m.button_text_sign_in_with_trakt()}</span>
    </a>
    <p class="attribution">{m.text_powered_by_trakt()}</p>
  </section>
</main>

<style lang="scss">
  @use "$style/scss/mixins/index" as *;

  .trakt-login-page {
    display: grid;
    min-height: var(--page-min-height);
    background: var(--color-background);

    .login-card {
      box-sizing: border-box;
      width: min(var(--login-card-width), calc(100% - var(--ni-32)));
      margin-block-start: var(--login-card-offset);
      margin-inline: auto;
      padding: var(--ni-32);
      border-radius: var(--border-radius-s);
      background: var(--color-surface);
    }

    h1 {
      margin: var(--ni-0);
      color: var(--color-text-primary);
      font-size: var(--font-size-h2);
    }

    .help,
    .error,
    .attribution {
      font-size: var(--font-size-small);
    }

    .help,
    .attribution {
      color: var(--color-text-help);
    }

    .error {
      color: var(--color-danger);
    }

    .sign-in {
      display: block;
      box-sizing: border-box;
      width: 100%;
      padding: var(--ni-6) var(--ni-12);
      border-radius: var(--border-radius-s);
      background: var(--color-accent);
      color: var(--color-text-primary);
      font-size: var(--font-size-button);
      text-align: center;
      text-decoration: none;

      &:hover {
        background: var(--color-accent-hover);
      }
    }

    .attribution {
      margin-block-end: var(--ni-0);
      font-size: var(--font-size-label);
      text-align: center;
    }

    @include for-mobile {
      .login-card {
        width: auto;
        margin-inline: var(--ni-16);
      }
    }
  }
</style>
