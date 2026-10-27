<script lang="ts">
  import { useListMembership } from '$lib/features/media-actions/stores/useListMembership.ts';
  import ListMenuRow from './ListMenuRow.svelte';
  import type { ListMembershipRowProps } from './ListMembershipRowProps.ts';

  const { list, type, id, variant }: ListMembershipRowProps = $props();
  // Keyed by its list, so the store made here serves the row's whole life.
  // svelte-ignore state_referenced_locally
  const { isListed, add, remove } = useListMembership({ list, type, id });
</script>

<ListMenuRow isOn={$isListed} {add} {remove} {variant}>
  {list.name}
</ListMenuRow>
