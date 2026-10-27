import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import ComponentTestBed from '$test/beds/component/ComponentTestBed.svelte';

type RenderComponentProps<T extends Record<string, unknown>> = {
  props: T;
};

export function renderComponent<T extends Record<string, unknown>>(
  component: Component<T>,
  { props }: RenderComponentProps<NoInfer<T>>,
) {
  const userLoaded = Promise.withResolvers<void>();
  const result = render(ComponentTestBed, {
    props: {
      component,
      componentProps: props,
      onUserLoaded: userLoaded.resolve,
    },
  });

  return {
    ...result,
    userLoaded: userLoaded.promise,
    rerender: (nextProps: T) => result.rerender({ componentProps: nextProps }),
  };
}
