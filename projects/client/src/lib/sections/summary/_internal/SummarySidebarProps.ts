import type { InfoSection } from '$lib/sections/summary/InfoSection.ts';
import type {
  ExternalLink,
  SummaryPoster,
} from '$lib/sections/summary/SummaryInfoProps.ts';

export type SummarySidebarProps = {
  poster: SummaryPoster;
  links: ReadonlyArray<ExternalLink>;
  sections: ReadonlyArray<InfoSection>;
  activeId: string | undefined;
};
