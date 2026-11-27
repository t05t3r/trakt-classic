import { ITEM_ID } from '$lib/features/view-params/ITEM_ID.ts';
import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import type { Component } from 'svelte';
import { expect } from 'vitest';

type RenderFiltersPageParams =
  | { filters?: string; search?: string; follows?: never; show?: never }
  // page.url then follows each replace, the one that sets the show included.
  | { filters?: string; search?: never; follows: true; show?: number };

const useShowParam = () => useViewParam({ show: ITEM_ID });

export function renderFiltersPage(
  page: Component<{ filters: string }>,
  path: `/${string}`,
) {
  return async (
    { filters = '', search = '', follows, show }: RenderFiltersPageParams = {},
  ) => {
    const at: `/${string}` = filters === '' ? path : `${path}/${filters}`;
    if (follows) {
      followReplaces(at);
    } else {
      openAt(`${at}${search}`);
    }
    // One store for every set of the render; only a page that follows its replaces reads them.
    const showParam = follows ? await renderStore(useShowParam) : undefined;
    const setShow = async (id: number | null) => {
      expect(showParam, 'setShow needs a page rendered with follows')
        .toBeDefined();
      await showParam?.set({ show: id === null ? null : String(id) });
    };
    if (show !== undefined) await setShow(show);
    const { container, rerender, userLoaded } = renderComponent(page, {
      props: { filters },
    });
    await userLoaded;

    return { container, rerender, setShow };
  };
}
