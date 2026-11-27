<script lang="ts">
  import PosterWall from '$lib/components/media/PosterWall.svelte';
  import { useUpNext } from '$lib/features/dashboard/stores/useUpNext.ts';
  import { useQuery } from '$lib/features/query/useQuery.ts';
  import { watchlistPreviewQuery } from '$lib/requests/queries/sync/watchlistPreviewQuery.ts';
  import { toHeroPosters } from './toHeroPosters.ts';

  const upNext = useUpNext();
  const watchlist = useQuery(watchlistPreviewQuery());

  const posters = $derived(
    toHeroPosters({
      upNext: $upNext.kind === 'ready' ? $upNext.data : [],
      watchlist: $watchlist.data?.entries ?? [],
    }),
  );
</script>

<PosterWall {posters} />
