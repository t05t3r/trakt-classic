import type { ListType } from './ListType.ts';

export type ListsType = Extract<ListType, 'official' | 'personal'>;
