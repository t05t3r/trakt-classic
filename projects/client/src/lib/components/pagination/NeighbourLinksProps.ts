import type { Pathname } from '$app/types';

export type NeighbourLinksProps = {
  previous?: Pathname;
  next?: Pathname;
  previousLabel: string;
  nextLabel: string;
};
