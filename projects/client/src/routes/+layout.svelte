<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import ConfirmationProvider from '$lib/features/confirmation/ConfirmationProvider.svelte';
  import ErrorProvider from '$lib/features/errors/ErrorProvider.svelte';
  import FeatureFlagProvider from '$lib/features/feature-flag/FeatureFlagProvider.svelte';
  import WriteQueueProvider from '$lib/features/media-actions/WriteQueueProvider.svelte';
  import NavigationProvider from '$lib/features/navigation/NavigationProvider.svelte';
  import GlobalParameterProvider from '$lib/features/parameters/GlobalParameterProvider.svelte';
  import QueryClientProvider from '$lib/features/query/QueryClientProvider.svelte';
  import ThemeProvider from '$lib/features/theme/components/ThemeProvider.svelte';
  import ToastProvider from '$lib/features/toast/ToastProvider.svelte';
  import { setHydrated } from '$lib/utils/hydration/hydration.ts';
  import '$style/index.ts';
  import { onMount } from 'svelte';

  const { children, data } = $props();

  // A parent mounts after its children, so every image of the first render reads it as not yet hydrated.
  onMount(() => setHydrated(true));
</script>

<svelte:head>
  <title>{m.text_app_name()}</title>
</svelte:head>

<ErrorProvider>
  <QueryClientProvider client={data.queryClient}>
    <WriteQueueProvider>
      <ConfirmationProvider>
        <GlobalParameterProvider>
          <FeatureFlagProvider>
            <NavigationProvider>
              <ToastProvider>
                <ThemeProvider>
                  {@render children()}
                </ThemeProvider>
              </ToastProvider>
            </NavigationProvider>
          </FeatureFlagProvider>
        </GlobalParameterProvider>
      </ConfirmationProvider>
    </WriteQueueProvider>
  </QueryClientProvider>
</ErrorProvider>
