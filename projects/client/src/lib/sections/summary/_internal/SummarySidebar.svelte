<script lang="ts">
  import { resolve } from '$app/paths';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import UserRatingCorner from '$lib/features/media-card/components/UserRatingCorner.svelte';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import type { SummarySidebarProps } from './SummarySidebarProps.ts';

  const { poster, links, sections, activeId }: SummarySidebarProps = $props();
</script>

{#snippet image()}
  <LazyImage
    src={poster.src}
    alt={m.image_alt_media_poster({ title: poster.title })}
    kind="poster"
    loading="eager"
  />
{/snippet}

<div class="trakt-summary-sidebar">
  <!-- The corner sits beside the link, so the link keeps the poster's name. -->
  <div class="sidebar-poster-frame">
    {#if poster.href}
      <a class="sidebar-poster" href={resolve(poster.href)}>{@render image()}</a>
    {:else}
      <div class="sidebar-poster">{@render image()}</div>
    {/if}
    {#if poster.ratingTarget}
      {#key poster.ratingTarget.id}
        <UserRatingCorner target={poster.ratingTarget} />
      {/key}
    {/if}
  </div>

  <ul class="sidebar-sections" role="list">
    {#each sections as section (section.id)}
      {@const isActive = section.id === activeId}
      <li class="sidebar-section">
        <a
          class="sidebar-section-link"
          class:is-active={isActive}
          href="#{section.id}"
          aria-current={isActive ? 'true' : undefined}
        >
          {section.count === undefined
            ? section.label
            : m.text_stats_count({
              count: toGroupedNumber(section.count),
              unit: section.label,
            })}
        </a>
      </li>
    {/each}
  </ul>

  {#if links.length > 0}
    <ul class="sidebar-links" role="list">
      {#each links as link (link.key)}
        <li>
          <a
            class="sidebar-link"
            href={link.href}
            target="_blank"
            rel="external noopener"
          >
            {link.label}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-summary-sidebar {
    .sidebar-poster-frame {
      position: relative;
      border: var(--ni-3) solid var(--color-border-poster);
      box-shadow: var(--shadow-poster);
    }

    .sidebar-poster {
      display: block;
    }

    .sidebar-sections,
    .sidebar-links {
      padding: var(--ni-0);
      list-style: none;
    }

    .sidebar-sections {
      margin: var(--ni-10) var(--ni-0) var(--ni-0);

      .sidebar-section {
        border-block-end: var(--border-thickness-xxs) solid var(--color-border);
      }
    }

    .sidebar-section-link {
      display: block;
      padding-block: var(--ni-7);
      color: var(--color-text-help);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-heading-muted);
      font-weight: var(--font-weight-heading);
      line-height: var(--line-height-text);
      text-decoration: none;
      text-transform: uppercase;
      transition: color var(--transition-default);

      &.is-active {
        color: var(--color-link);
      }

      @include for-mouse {
        &:hover {
          color: var(--color-text-primary);
        }
      }
    }

    .sidebar-links {
      display: flex;
      flex-wrap: wrap;
      margin-block: var(--ni-8);
      margin-inline-start: var(--ni-neg-6);
      padding-block-end: var(--ni-6);
    }

    .sidebar-link {
      display: inline-block;
      margin-block-start: var(--ni-6);
      margin-inline-start: var(--ni-6);
      padding: var(--ni-3) var(--ni-5);
      border: var(--border-thickness-xxs) solid var(--color-external-chip-background);
      border-radius: var(--border-radius-xs);
      background: var(--color-external-chip-background);
      color: var(--color-external-chip-text);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-heading-light);
      text-decoration: none;
      transition:
        background-color var(--transition-default),
        color var(--transition-default);

      @include for-mouse {
        &:hover {
          background: var(--color-external-chip-background-hover);
          color: var(--color-external-chip-text-hover);
        }
      }
    }
  }
</style>
