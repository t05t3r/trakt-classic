import type { Snippet } from 'svelte';
import type { SectionErrorProps } from '../SectionErrorProps.ts';
import type { StatusFrameProps } from '../StatusFrameProps.ts';

export type StatusBodyProps<T> =
  & StatusFrameProps<T>
  & Pick<SectionErrorProps, 'fallback'>
  & {
    // Rendered while the status loads; nothing renders without it.
    pending?: Snippet;
  };
