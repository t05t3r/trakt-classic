<script lang="ts">
  import { useUser } from '$lib/features/auth/stores/useUser.ts';
  import ProfileTabs from '$lib/sections/user-cover/ProfileTabs.svelte';
  import UserCover from '$lib/sections/user-cover/UserCover.svelte';
  import type { UserCoverPageProps } from './_internal/UserCoverPageProps.ts';

  const { cover, selected, children }: UserCoverPageProps = $props();

  const user = useUser().settings;
</script>

<UserCover {cover} user={$user} isPrivate={$user?.isPrivate}>
  {#snippet tabs()}
    <ProfileTabs {selected} />
  {/snippet}
</UserCover>
{@render children()}
