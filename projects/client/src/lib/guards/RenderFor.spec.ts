import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import RenderForMountHost from '$test/beds/guards/RenderForMountHost.svelte';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import RenderFor from './RenderFor.svelte';

const setLayout = fakeLayouts({
  desktop: WELL_KNOWN_MEDIA_QUERY.desktop,
  mobile: WELL_KNOWN_MEDIA_QUERY.mobile,
  mouse: WELL_KNOWN_MEDIA_QUERY.mouse,
});

function renderMoments(device: ReadonlyArray<'mobile' | 'desktop'>) {
  const moments: string[] = [];
  renderComponent(RenderForMountHost, {
    props: { device, onMoment: (moment) => moments.push(moment) },
  });
  return moments;
}

describe('component: RenderFor', () => {
  describe('for device', () => {
    it('should render content for the current device in the first render, before the page around it mounts', () => {
      setLayout('desktop');

      expect(renderMoments(['desktop']))
        .toEqual(['content attached', 'host mounted']);
    });

    it('should leave content for another device out, from the first render on', async () => {
      setLayout('desktop');

      const moments = renderMoments(['mobile']);
      expect(moments).toEqual(['host mounted']);
      await waitNegativeClaim();
      expect(moments).toEqual(['host mounted']);
      expect(screen.queryByText('Gated')).toBeNull();
    });
  });

  describe('for input', () => {
    it('should leave the CSS gate off in the browser for content allowed on both mouse and touch', async () => {
      setLayout('mouse');

      renderComponent(RenderFor, {
        props: {
          audience: 'all',
          input: ['mouse', 'touch'],
          children: createRawSnippet(() => ({
            render: () => '<span>Watch now</span>',
          })),
        },
      });

      const content = await screen.findByText('Watch now');
      const gate = content.closest('trakt-render-for');

      expect(gate).not.toHaveAttribute('data-mouse', 'true');
      expect(gate).not.toHaveAttribute('data-touch', 'true');
    });
  });
});
