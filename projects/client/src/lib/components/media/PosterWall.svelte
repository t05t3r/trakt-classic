<script lang="ts">
  const { posters }: { posters: ReadonlyArray<string> } = $props();

  // SVG attributes take no custom property, so the tile's geometry lives here.
  const TILE_SIZE = 240;
  const CELL_WIDTH = 40;
  const CELL_HEIGHT = 60;
  const COLUMNS = TILE_SIZE / CELL_WIDTH;
  const CELL_COUNT = COLUMNS * (TILE_SIZE / CELL_HEIGHT);

  const patternId = $props.id();

  const cells = $derived(
    posters.length === 0
      ? []
      : Array.from({ length: CELL_COUNT }, (_, index) => ({
        href: posters.at(index % posters.length),
        x: (index % COLUMNS) * CELL_WIDTH,
        y: Math.floor(index / COLUMNS) * CELL_HEIGHT,
      })),
  );
</script>

{#if cells.length > 0}
  <svg class="trakt-poster-wall" aria-hidden="true">
    <defs>
      <pattern
        id={patternId}
        width={TILE_SIZE}
        height={TILE_SIZE}
        patternUnits="userSpaceOnUse"
      >
        {#each cells as cell, index (index)}
          <image
            href={cell.href}
            x={cell.x}
            y={cell.y}
            width={CELL_WIDTH}
            height={CELL_HEIGHT}
          />
        {/each}
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#{patternId})" />
  </svg>
{/if}

<style lang="scss">
  .trakt-poster-wall {
    position: absolute;
    inset: var(--ni-0);
    z-index: var(--layer-background);
    width: 100%;
    height: 100%;
    opacity: var(--poster-wall-opacity);
    filter: blur(var(--poster-wall-blur));
  }
</style>
