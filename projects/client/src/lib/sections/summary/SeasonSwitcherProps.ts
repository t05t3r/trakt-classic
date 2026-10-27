import type { Pathname } from '$app/types';

export type SwitcherEntry = {
  label: string;
  href: Pathname;
  isCurrent: boolean;
};

export type SeasonSwitcherProps = {
  label: string;
  entries: ReadonlyArray<SwitcherEntry>;
};
