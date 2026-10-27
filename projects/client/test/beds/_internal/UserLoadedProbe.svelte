<script lang="ts">
  import { useUser } from '$lib/features/auth/stores/useUser.ts';
  import { filter, take } from 'rxjs';
  import { onDestroy, tick } from 'svelte';

  const { onLoaded }: { onLoaded: () => void } = $props();

  // The tick waits for Svelte to apply the user, whichever observer the query notifies first.
  const subscription = useUser()
    .user.pipe(
      filter(($user) => $user.data != null),
      take(1),
    )
    .subscribe(() => void tick().then(() => onLoaded()));

  onDestroy(() => subscription.unsubscribe());
</script>
