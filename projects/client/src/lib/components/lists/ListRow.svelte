<script lang="ts">
  import { resolve } from '$app/paths';
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import ClampedText from '$lib/components/text/ClampedText.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import IconFile from '@tabler/icons-svelte/icons/file';
  import type { ListRowProps } from './ListRowProps.ts';

  const {
    name,
    href,
    owner,
    description,
    count,
    posters,
    avatar,
    variant,
  }: ListRowProps = $props();
</script>

<div class="trakt-list-row" data-variant={variant}>
  <div class="list-row-posters">
    {#if href}
      <!-- The list name links to the same page. -->
      <a
        class="list-row-fan-link"
        href={resolve(href)}
        tabindex="-1"
        aria-hidden="true"
      >
        {@render posters()}
      </a>
    {:else}
      {@render posters()}
    {/if}
  </div>
  <div class="list-row-info">
    <div class="list-row-header">
      <div class="list-row-avatar">{@render avatar()}</div>
      <div class="list-row-names">
        <h3 class="list-row-name">
          {#if href}
            <a class="list-row-name-link" href={resolve(href)}>{name}</a>
          {:else}
            {name}
          {/if}
        </h3>
        <h4 class="list-row-owner">
          {#if typeof owner === 'string'}{owner}{:else}{@render owner()}{/if}
        </h4>
      </div>
      <div class="list-row-interactions">
        <CountStat
          icon={IconFile}
          value={toGroupedNumber(count)}
          label={m.text_lists_items()}
        />
      </div>
    </div>
    {#if description}
      <div class="list-row-overview">
        <ClampedText>
          <p class="list-row-description">{description}</p>
        </ClampedText>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-list-row {
    display: flex;
    padding-block-start: var(--ni-20);

    .list-row-posters {
      flex: none;
    }

    .list-row-fan-link {
      display: block;
    }

    .list-row-info {
      flex: 1;
      min-width: var(--ni-0);
      margin-inline-start: var(--ni-20);
    }

    // The header's surface reaches back to the poster fan.
    .list-row-header {
      display: flex;
      align-items: flex-start;
      margin-inline-start: var(--ni-neg-20);
      padding: var(--ni-10) var(--ni-20);
      background: var(--color-surface-menu);
    }

    .list-row-avatar {
      flex: none;
      box-sizing: border-box;
      width: var(--avatar-size-m);
      height: var(--avatar-size-m);
      overflow: hidden;
      border: var(--avatar-ring) solid var(--color-avatar-ring);
      border-radius: var(--border-radius-round);
      background: var(--color-avatar-ring);
    }

    .list-row-names {
      flex: 1;
      min-width: var(--ni-0);
      padding-inline-start: var(--ni-12);
    }

    .list-row-name,
    .list-row-owner {
      margin: var(--ni-2) var(--ni-0) var(--ni-0);
      line-height: var(--line-height-heading);
    }

    .list-row-name {
      font-size: var(--font-size-h2-compact);
      font-weight: var(--font-weight-heading);
    }

    .list-row-name-link {
      color: inherit;
      text-decoration: none;
    }

    @include for-mouse {
      .list-row-name-link:hover {
        text-decoration: underline;
      }
    }

    .list-row-owner {
      font-size: var(--font-size-small);

      // The owner's name takes the heading weight, not the browser's bolder.
      :global(b) {
        font-weight: var(--font-weight-heading);
      }
    }

    .list-row-interactions {
      flex: none;
      margin-block-start: var(--ni-12);
      white-space: nowrap;
    }

    .list-row-overview {
      --clamp-shade-color: var(--color-surface);

      margin-block: var(--ni-20);
      overflow-wrap: break-word;
    }

    .list-row-description {
      margin: var(--ni-0);
    }

    // Phones stack the fan above the info and the count under the names.
    @include for-mobile {
      display: block;
      padding-block: var(--ni-20);

      .list-row-info {
        margin-inline-start: var(--ni-0);
      }

      .list-row-header {
        flex-wrap: wrap;
        margin-inline-start: var(--ni-0);
        padding-inline-start: var(--ni-10);
      }

      .list-row-interactions {
        flex: 1 1 100%;
        margin-inline-start: var(--ni-35);
      }

      .list-row-overview {
        margin: var(--ni-10) var(--ni-10) var(--ni-0);
      }

      &[data-variant='summary'] {
        padding-block-end: var(--ni-0);
      }

      &[data-variant='summary'] .list-row-overview {
        display: none;
      }

      &[data-variant='summary']:not(:first-child) {
        padding-block-start: var(--ni-0);
      }
    }
  }
</style>
