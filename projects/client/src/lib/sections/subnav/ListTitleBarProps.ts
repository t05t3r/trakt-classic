import type { Pathname } from '$app/types';

export type ListTitleBarProps = {
  title: string;
  href: Pathname;
  titleId: string;
  loading: boolean;
  open: boolean;
  panelId: string;
  gearId: string;
  ontoggle: () => void;
};
