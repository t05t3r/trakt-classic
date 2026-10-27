<script lang="ts">
  import AuthProvider from '$lib/features/auth/AuthProvider.svelte';
  import Footer from '$lib/sections/footer/Footer.svelte';
  import Navbar from '$lib/sections/navbar/Navbar.svelte';
  import ToastRegion from '$lib/sections/navbar/ToastRegion.svelte';

  const { children, data } = $props();
</script>

<AuthProvider auth={data.auth}>
  <div class="trakt-app-frame">
    <Navbar />
    <ToastRegion />
    <main class="app-main">
      {@render children()}
    </main>
    <Footer />
  </div>
</AuthProvider>

<style lang="scss">
  /* On a page shorter than the viewport, the footer sits at its bottom. */
  .trakt-app-frame {
    display: flex;
    flex-direction: column;
    min-height: var(--page-min-height);
    min-height: 100dvh;

    /* Page content paints under the fixed header whatever its own z-index. */
    .app-main {
      flex-grow: 1;
      isolation: isolate;

      /* It takes focus only as a fallback target, and a ring would outline the whole content. */
      &:focus {
        outline: none;
      }
    }
  }
</style>
