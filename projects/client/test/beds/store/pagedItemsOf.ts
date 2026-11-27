import { type Mock, vi } from 'vitest';

type ReplacePage = (page: number) => void;

type PagedStore<V, R> = (props: { values: V; replacePage: ReplacePage }) => R;

export type PagedItems<R> = {
  store: () => { reading: R };
  replacePage: Mock<ReplacePage>;
};

export function pagedItemsOf<V, R>(useItems: PagedStore<V, R>, defaults: V) {
  return (values: Partial<V>): PagedItems<R> => {
    const replacePage = vi.fn<ReplacePage>();
    const store = () => ({
      reading: useItems({ values: { ...defaults, ...values }, replacePage }),
    });

    return { store, replacePage };
  };
}
