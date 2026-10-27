import type { Pathname } from '$app/types';

export type SeeMoreLinkProps = {
  href: Pathname;
  label: string;
  // Follows the label in the accessible name, where the label alone would not tell links apart.
  context?: string;
};
