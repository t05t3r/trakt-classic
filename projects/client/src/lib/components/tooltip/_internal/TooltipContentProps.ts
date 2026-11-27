import type { Hint } from '../Hint.ts';

export type TooltipContentProps =
  & Pick<Hint, 'content' | 'detail' | 'side'>
  & { id: string };
