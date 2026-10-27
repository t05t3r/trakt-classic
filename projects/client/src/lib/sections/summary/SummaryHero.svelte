<script lang="ts">
  import Certification from '$lib/components/badges/Certification.svelte';
  import { isPlaceholder } from '$lib/features/image/isPlaceholder.ts';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import HeroBackdrop from './_internal/HeroBackdrop.svelte';
  import type { SummaryHeroProps } from './_internal/SummaryHeroProps.ts';

  const {
    backdrop,
    title,
    sxe,
    year,
    yearZoned,
    certification,
    breadcrumb,
    premiere,
    poster,
    ratings,
    neighbours,
  }: SummaryHeroProps = $props();

  const hydrated = useHydrated();
</script>

<section class="trakt-summary-hero">
  {#if backdrop && !isPlaceholder(backdrop)}
    <!-- A new backdrop fades in from black, as the first one did. -->
    {#key backdrop}
      <HeroBackdrop src={backdrop} />
    {/key}
  {/if}
  <div class="hero-shade"></div>
  {#if neighbours}
    <div class="hero-neighbours">{@render neighbours()}</div>
  {/if}
  <div class="hero-title-block">
    {#if poster}
      <div class="hero-mobile-poster">{@render poster()}</div>
    {/if}
    <ContainerPage>
      <div data-layout="grid">
        <div class="hero-title-column" data-grid-column>
          {#if premiere}
            <div class="hero-premiere">{@render premiere()}</div>
          {/if}
          {#if breadcrumb}
            <h2 class="hero-breadcrumb">{@render breadcrumb()}</h2>
          {/if}
          <!-- No whitespace between the year and the chip: the chip's margin is the whole gap. -->
          <h1 class="hero-title" data-variant={sxe ? 'episode' : undefined}>
            {#if sxe}
              {sxe}
              <span class="hero-title-main">{title}</span>
            {:else}
              {title}
            {/if}
            {#if year != null && (!yearZoned || $hydrated)}
              <span class="hero-year">{year}</span>
            {/if}{#if certification}
              <Certification {certification} />
            {/if}
          </h1>
        </div>
      </div>
    </ContainerPage>
  </div>
  {#if ratings}
    <div class="hero-ratings">{@render ratings()}</div>
  {/if}
</section>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-summary-hero {
    position: relative;
    overflow: hidden;
    height: var(--hero-height);
    background: var(--color-background);
    color: var(--color-text-primary);

    .hero-shade {
      position: absolute;
      inset-inline: var(--ni-0);
      inset-block-end: var(--ratings-bar-height);
      height: var(--ni-120);
      background: var(--gradient-hero-fade);
    }

    .hero-title-block {
      position: absolute;
      inset-inline: var(--ni-0);
      inset-block-end: var(--ni-70);
    }

    .hero-mobile-poster {
      display: none;
    }

    // A band across the hero that passes the pointer through to it, its links aside.
    .hero-neighbours {
      position: absolute;
      z-index: var(--layer-raised);
      inset-block-start: var(--ni-188);
      inset-inline: var(--ni-0);
      pointer-events: none;
    }

    .hero-ratings {
      position: absolute;
      inset-inline: var(--ni-0);
      inset-block-end: var(--ni-0);
    }

    // The title lines up with the info column below the hero.
    .hero-title-column {
      @include summary-info-column;
    }

    .hero-breadcrumb {
      margin: var(--ni-0) var(--ni-0) var(--ni-5);
      color: var(--color-text-secondary);
      font-size: var(--font-size-hero-breadcrumb);
      font-weight: var(--font-weight-heading);
      line-height: var(--line-height-heading);
      text-shadow: var(--text-shadow-on-image);

      :global(a) {
        color: var(--color-text-secondary);
        text-decoration: none;
        transition: color var(--transition-default);
      }

      @include for-mouse {
        :global(a:hover) {
          color: var(--color-accent);
        }
      }
    }

    .hero-title {
      margin: var(--ni-0);
      font-size: var(--font-size-h1);
      font-weight: var(--font-weight-heading);
      line-height: var(--line-height-hero-title);
      text-shadow: var(--text-shadow-on-image);
    }

    .hero-premiere {
      line-height: var(--line-height-heading);
    }

    .hero-title[data-variant='episode'] .hero-title-main {
      font-weight: var(--font-weight-heading-light);
    }

    .hero-year {
      color: var(--color-text-help);
      font-size: var(--font-size-hero-year);
      font-weight: var(--font-weight-heading-light);
    }

    @include for-mobile {
      height: var(--hero-height-mobile);

      .hero-shade {
        height: var(--ni-150);
      }

      .hero-neighbours {
        display: none;
      }

      .hero-title-block {
        inset-block-end: var(--ni-110);
      }

      .hero-mobile-poster {
        display: block;
        position: absolute;
        inset-inline-start: var(--ni-12);
        inset-block-end: var(--ni-2);
      }

      // The column clears the poster's slot whether or not a poster fills it.
      .hero-title-column {
        margin-inline-start: var(--ni-80);
      }
    }
  }
</style>
