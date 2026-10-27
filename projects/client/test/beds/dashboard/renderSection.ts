import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { screen } from '@testing-library/svelte';
import type { Component } from 'svelte';

interface RenderSectionParams {
  component: Component<Record<string, never>>;
  name: string;
}

export async function renderSection(
  { component, name }: RenderSectionParams,
): Promise<HTMLElement> {
  const { userLoaded } = renderComponent(component, { props: {} });
  await userLoaded;
  return screen.findByRole('region', { name });
}
