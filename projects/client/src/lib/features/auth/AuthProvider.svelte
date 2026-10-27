<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
  import { submitLogout } from '$lib/features/auth/submitLogout.ts';
  import { useUser } from '$lib/features/auth/stores/useUser.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import { iffy } from '$lib/utils/function/iffy.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import { filter, fromEvent, switchMap, take, tap } from 'rxjs';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { createAuthContext } from './_internal/createAuthContext.ts';
  import type { AuthData } from './models/AuthData.ts';

  const { auth, children }: {
    auth: Pick<AuthData, 'isAuthorized'>;
    children: Snippet;
  } = $props();
  iffy(() =>
    createAuthContext({ isAuthorized: auth.isAuthorized, logout: submitLogout })
  );
  const { user } = iffy(useUser);

  onMount(() => {
    const subscription = sessionExpired.pipe(
      take(1),
      // A full document load starts the token, the query cache and the Write Queue afresh.
      tap(() =>
        window.location.assign(
          resolve(
            UrlBuilder.landing({
              returnTo: `${page.url.pathname}${page.url.search}`,
              error: 'expired',
            }),
          ),
        )
      ),
      // A back/forward cache restore would bring the expired page back as it was.
      switchMap(() => fromEvent<PageTransitionEvent>(window, 'pageshow')),
      filter((event) => event.persisted),
    ).subscribe(() => window.location.reload());

    return () => subscription.unsubscribe();
  });
</script>

{#if $user.isError}
  <section role="alert">
    <p>{m.error_text_auth_unavailable()}</p>
    <button type="button" onclick={() => void $user.refetch()}>
      {m.button_text_retry()}
    </button>
  </section>
{:else}
  {@render children()}
{/if}
