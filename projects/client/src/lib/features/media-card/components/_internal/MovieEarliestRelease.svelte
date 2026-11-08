<script lang="ts">
  import { useQuery } from '$lib/features/query/useQuery.ts';
  import { movieReleasesQuery } from '$lib/requests/queries/movies/movieReleasesQuery.ts';
  import { toEarliestReleaseDate } from '$lib/utils/media/toEarliestReleaseDate.ts';
  import type { Snippet } from 'svelte';

  const {
    slug,
    released,
    children,
  }: {
    slug: string;
    released: Date;
    children: Snippet<[Date]>;
  } = $props();

  // Keyed by its movie at the caller, so the query made here serves its whole life.
  // svelte-ignore state_referenced_locally
  const releases = useQuery(movieReleasesQuery({ slug }));
</script>

<!-- A failed or pending read leaves no data, so the movie's own date stands. -->
{@render children(
  toEarliestReleaseDate({ earliestRelease: $releases.data, released }),
)}
