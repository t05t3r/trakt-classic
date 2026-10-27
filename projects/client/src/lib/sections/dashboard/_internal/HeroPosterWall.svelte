<script lang="ts">
  import PosterWall from '$lib/components/media/PosterWall.svelte';
  import { useQuery } from '$lib/features/query/useQuery.ts';
  import { upNextQuery } from '$lib/requests/queries/sync/upNextQuery.ts';
  import { watchlistPreviewQuery } from '$lib/requests/queries/sync/watchlistPreviewQuery.ts';
  import { toHeroPosters } from './toHeroPosters.ts';

  const upNext = useQuery(upNextQuery());
  const watchlist = useQuery(watchlistPreviewQuery());

  const posters = $derived(
    toHeroPosters({
      upNext: $upNext.data ?? [],
      watchlist: $watchlist.data?.entries ?? [],
    }),
  );
</script>

<PosterWall {posters} />
