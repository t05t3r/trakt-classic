<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import IconCircleMinus from '@tabler/icons-svelte/icons/circle-minus';
  import { LOCALE_MAP } from '$lib/utils/formatting/date/LOCALE_MAP.ts';
  import { format } from 'date-fns/format';

  const { droppedAt }: { droppedAt: Date } = $props();

  const label = $derived(
    m.tooltip_text_dropped_on({
      date: format(droppedAt, 'd MMM yyyy HH:mm', { locale: LOCALE_MAP.en }),
    }),
  );
</script>

<div class="trakt-dropped-badge">
  <span class="dropped-badge-glyph" role="img" title={label} aria-label={label}>
    <IconCircleMinus class="dropped-badge-icon" aria-hidden="true" />
  </span>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-dropped-badge {
    position: absolute;
    inset: var(--ni-0);
    display: grid;
    place-items: center;
    color: var(--color-text-tertiary);
    transition: color var(--transition-default);

    @include for-mouse {
      &:hover {
        color: var(--color-text-primary);
      }
    }

    .dropped-badge-glyph {
      display: grid;
      place-items: center;
    }

    :global(.dropped-badge-icon) {
      width: var(--icon-size-badge-dropped);
      height: var(--icon-size-badge-dropped);
      stroke-width: var(--icon-stroke-badge);

      @include for-mobile {
        width: var(--icon-size-badge-dropped-sm);
        height: var(--icon-size-badge-dropped-sm);
      }
    }
  }
</style>
