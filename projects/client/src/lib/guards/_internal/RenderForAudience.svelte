<script lang="ts">
  import { useAuth } from '$lib/features/auth/stores/useAuth.ts';
  import { useUser } from '$lib/features/auth/stores/useUser.ts';
  import type { RenderForAudienceProps } from './RenderForAudienceProps.ts';

  const { children, audience }: RenderForAudienceProps = $props();
  const { isAuthorized } = useAuth();
  const { user } = useUser();
  const isAvailableForAudience = $derived(
    audience === 'all' ||
      (audience === 'authenticated' && $isAuthorized && $user.data != null) ||
      (audience === 'director' && $isAuthorized && $user.data?.isDirector) ||
      (audience === 'vip' && $isAuthorized && $user.data?.isVip) ||
      (audience === 'free' && $isAuthorized && !$user.data?.isVip),
  );
</script>

{#if isAvailableForAudience}
  {@render children()}
{/if}
