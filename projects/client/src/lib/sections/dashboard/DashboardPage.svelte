<script lang="ts">
  import DashboardSection from './_internal/DashboardSection.svelte';
  import GreetingHero from './_internal/GreetingHero.svelte';
  import HeroPosterWall from './_internal/HeroPosterWall.svelte';
  import StatsStrip from './_internal/StatsStrip.svelte';
  import Last30DaysSection from './Last30DaysSection.svelte';
  import RecentlyWatchedSection from './RecentlyWatchedSection.svelte';
  import RecommendationsSection from './RecommendationsSection.svelte';
  import UpcomingScheduleSection from './UpcomingScheduleSection.svelte';
  import UpNextSection from './UpNextSection.svelte';
  import WatchlistSection from './WatchlistSection.svelte';
</script>

<div class="trakt-dashboard-page">
  <DashboardSection name="hero">
    <GreetingHero />
    {#snippet bleed()}
      <HeroPosterWall />
      <StatsStrip />
    {/snippet}
  </DashboardSection>

  <DashboardSection name="up-next">
    <UpNextSection />
  </DashboardSection>

  <DashboardSection name="schedule">
    <UpcomingScheduleSection />
  </DashboardSection>

  <DashboardSection name="watchlist">
    <WatchlistSection />
  </DashboardSection>

  <DashboardSection name="last-30-days">
    <Last30DaysSection />
  </DashboardSection>

  <DashboardSection name="recently-watched">
    <RecentlyWatchedSection />
  </DashboardSection>

  <DashboardSection name="recommendations">
    <RecommendationsSection />
  </DashboardSection>
</div>
