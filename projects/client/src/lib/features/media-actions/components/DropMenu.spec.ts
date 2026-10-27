import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { DEVS_DROP_SHOW } from '$mocks/data/media-actions/DEVS_DROP_SHOW.ts';
import { SILO_DROP_SHOW } from '$mocks/data/media-actions/SILO_DROP_SHOW.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import DropMenuHost from '$test/beds/media-actions/DropMenuHost.svelte';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { bodyUnlocked } from '$test/beds/scroll-lock/bodyUnlocked.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, onTestFinished } from 'vitest';
import DropMenu from './DropMenu.svelte';

const DROP_NAME = 'Flag show "Silo" as dropped';
const RESTORE_NAME = 'Restore show "Devs"';

const trigger = () => screen.findByRole('button', { name: DROP_NAME });
const menu = () =>
  screen.queryByRole('menu', { name: 'When did you drop this?' });
const restoreDialog = () =>
  screen.queryByRole('dialog', { name: 'Restore this show?' });

// The control ignores a press until the dropped shows are known.
async function settledControl(name: string) {
  const control = await screen.findByRole('button', { name });
  await waitFor(() => expect(control).not.toHaveAttribute('aria-disabled'));
  return control;
}

async function openMenu() {
  renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
  await userEvent.click(await settledControl(DROP_NAME));
  return screen.findByRole('menu', { name: 'When did you drop this?' });
}

beforeEach(() => {
  stubClientRects();
});

describe('component: DropMenu', () => {
  it('should open from its icon, titled with what it does', async () => {
    renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
    const icon = await settledControl(DROP_NAME);

    expect(icon).toHaveAttribute('title', DROP_NAME);
    expect(icon.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(menu()).not.toBeInTheDocument();

    await userEvent.click(icon);

    expect(await screen.findByRole('menu', { name: 'When did you drop this?' }))
      .toBeVisible();
  });

  it('should offer only Right now', async () => {
    await openMenu();

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent?.trim()),
    ).toEqual(['Right now']);
  });

  it('should drop the show on Right now and close', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(
        DROP_URL,
        async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 201 });
        },
      ),
    );
    await openMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Right now' }));

    await waitFor(() =>
      expect(bodies).toEqual([{
        shows: [{ ids: { trakt: SILO_DROP_SHOW.id } }],
      }])
    );
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
  });

  it('should stay shut while the dropped shows load', async () => {
    holdRequest({
      method: 'get',
      url: DROPPED_URL,
      answer: () => pagedResponse({ body: [] }),
    });
    renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
    const icon = await trigger();

    await userEvent.click(icon);
    await waitNegativeClaim();

    expect(icon).toHaveAttribute('aria-disabled', 'true');
    expect(menu()).not.toBeInTheDocument();
  });

  it('should stay shut while the drop is saved', async () => {
    const saving = holdRequest({
      method: 'post',
      url: DROP_URL,
      answer: () => new HttpResponse(null, { status: 201 }),
    });
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Right now' }));
    await saving.requested;

    const icon = await screen.findByRole('button', {
      name: 'Restore show "Silo"',
    });
    await bodyUnlocked();
    await userEvent.click(icon);
    await waitNegativeClaim();

    expect(icon).toHaveAttribute('aria-disabled', 'true');
    expect(restoreDialog()).not.toBeInTheDocument();
  });

  describe('for a dropped show', () => {
    it('should offer Restore in place of Drop, titled with what it does', async () => {
      renderComponent(DropMenu, { props: { show: DEVS_DROP_SHOW } });
      const icon = await settledControl(RESTORE_NAME);

      expect(icon).toHaveAttribute('title', RESTORE_NAME);
      expect(icon).not.toHaveAttribute('aria-haspopup');
      expect(icon.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(
        screen.queryByRole('button', { name: 'Flag show "Devs" as dropped' }),
      ).not.toBeInTheDocument();
    });

    it('should restore the show once the restore is confirmed', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(RESTORE_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 200 });
        }),
      );
      renderComponent(DropMenu, { props: { show: DEVS_DROP_SHOW } });

      await userEvent.click(await settledControl(RESTORE_NAME));
      await answerDialog('Restore this show?', 'Yes, restore it!');

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{ ids: { trakt: DEVS_DROP_SHOW.id } }],
        }])
      );
    });

    it('should write nothing when the restore is declined', async () => {
      const writes = recordWrites();
      renderComponent(DropMenu, { props: { show: DEVS_DROP_SHOW } });

      await userEvent.click(await settledControl(RESTORE_NAME));
      await answerDialog('Restore this show?', 'No');
      await waitNegativeClaim();

      expect(writes).toEqual([]);
      expect(await settledControl(RESTORE_NAME)).toBeVisible();
    });

    it('should keep the Drop menu shut while the restore is saved', async () => {
      const saving = holdRequest({
        method: 'post',
        url: RESTORE_URL,
        answer: () => new HttpResponse(null, { status: 200 }),
      });
      renderComponent(DropMenu, { props: { show: DEVS_DROP_SHOW } });
      await userEvent.click(await settledControl(RESTORE_NAME));
      await answerDialog('Restore this show?', 'Yes, restore it!');
      await saving.requested;

      const icon = await screen.findByRole('button', {
        name: 'Flag show "Devs" as dropped',
      });
      await userEvent.click(icon);
      await waitNegativeClaim();

      expect(icon).toHaveAttribute('aria-disabled', 'true');
      expect(menu()).not.toBeInTheDocument();
    });
  });

  describe("with the caller's triggers", () => {
    it('should open the menu from the Drop trigger it is given', async () => {
      renderComponent(DropMenuHost, { props: { show: SILO_DROP_SHOW } });
      const control = await settledControl('Drop');

      expect(screen.queryByRole('button', { name: DROP_NAME })).toBeNull();
      expect(control).toHaveAttribute('aria-haspopup', 'menu');

      await userEvent.click(control);

      expect(
        await screen.findByRole('menu', { name: 'When did you drop this?' }),
      )
        .toBeVisible();
    });

    it('should restore a dropped show from the Restore trigger it is given', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(RESTORE_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 200 });
        }),
      );
      renderComponent(DropMenuHost, { props: { show: DEVS_DROP_SHOW } });
      const control = await settledControl('Restore');

      expect(screen.queryByRole('button', { name: RESTORE_NAME })).toBeNull();

      await userEvent.click(control);
      await answerDialog('Restore this show?', 'Yes, restore it!');

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{ ids: { trakt: DEVS_DROP_SHOW.id } }],
        }])
      );
    });

    it('should keep the Drop trigger shut while the dropped shows load', async () => {
      holdRequest({
        method: 'get',
        url: DROPPED_URL,
        answer: () => pagedResponse({ body: [] }),
      });
      renderComponent(DropMenuHost, { props: { show: SILO_DROP_SHOW } });
      const control = await screen.findByRole('button', { name: 'Drop' });

      await userEvent.click(control);
      await waitNegativeClaim();

      expect(control).toHaveAttribute('aria-disabled', 'true');
      expect(menu()).not.toBeInTheDocument();
    });

    it('should keep the Restore trigger still while the drop is saved', async () => {
      const saving = holdRequest({
        method: 'post',
        url: DROP_URL,
        answer: () => new HttpResponse(null, { status: 201 }),
      });
      renderComponent(DropMenuHost, { props: { show: SILO_DROP_SHOW } });
      await userEvent.click(await settledControl('Drop'));
      await userEvent.click(
        await screen.findByRole('menuitem', { name: 'Right now' }),
      );
      await saving.requested;

      const control = await screen.findByRole('button', { name: 'Restore' });
      await bodyUnlocked();
      await userEvent.click(control);
      await waitNegativeClaim();

      expect(control).toHaveAttribute('aria-disabled', 'true');
      expect(restoreDialog()).not.toBeInTheDocument();
    });
  });

  describe('across the swap of Drop and Restore', () => {
    it.each(REMOVALS)(
      'should hand the focus from Drop to Restore, where removal $removal',
      async ({ emulate }) => {
        emulate();
        holdRequest({ method: 'post', url: DROP_URL });
        renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
        await openMenuFromKeyboard(
          await settledControl(DROP_NAME),
          'Right now',
        );

        await userEvent.keyboard('{Enter}');

        const restore = await screen.findByRole('button', {
          name: 'Restore show "Silo"',
        });
        await waitFor(() => expect(document.activeElement).toBe(restore));
      },
    );

    it.each(REMOVALS)(
      "should hand the focus from the caller's Restore to its Drop, where removal $removal",
      async ({ emulate }) => {
        emulate();
        holdRequest({ method: 'post', url: RESTORE_URL });
        renderComponent(DropMenuHost, { props: { show: DEVS_DROP_SHOW } });
        const control = await settledControl('Restore');
        control.focus();

        await userEvent.keyboard('{Enter}');
        await answerDialog('Restore this show?', 'Yes, restore it!');

        const drop = await screen.findByRole('button', { name: 'Drop' });
        await waitFor(() => expect(document.activeElement).toBe(drop));
      },
    );

    it.each([
      ...REMOVALS.map(({ removal, emulate }) => ({
        outcome: `fails, where removal ${removal}`,
        status: 500,
        emulate,
      })),
      { outcome: 'is ignored', status: 201, emulate: NOOP_FN },
    ])(
      'should hand the focus back to Drop when the drop $outcome',
      async ({ status, emulate }) => {
        emulate();
        const write = holdRequest({
          method: 'post',
          url: DROP_URL,
          answer: () => new HttpResponse(null, { status }),
        });
        renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
        await openMenuFromKeyboard(
          await settledControl(DROP_NAME),
          'Right now',
        );
        await userEvent.keyboard('{Enter}');
        const restore = await screen.findByRole('button', {
          name: 'Restore show "Silo"',
        });
        await waitFor(() => expect(document.activeElement).toBe(restore));

        write.release();

        const drop = await settledControl(DROP_NAME);
        await waitFor(() => expect(document.activeElement).toBe(drop));
      },
    );

    it.each(REMOVALS)(
      'should hand the focus back to Restore when the restore fails, where removal $removal',
      async ({ emulate }) => {
        emulate();
        const write = holdRequest({
          method: 'post',
          url: RESTORE_URL,
          answer: () => new HttpResponse(null, { status: 500 }),
        });
        renderComponent(DropMenu, { props: { show: DEVS_DROP_SHOW } });
        await userEvent.click(await settledControl(RESTORE_NAME));
        await answerDialog('Restore this show?', 'Yes, restore it!');
        const drop = await screen.findByRole('button', {
          name: 'Flag show "Devs" as dropped',
        });
        await waitFor(() => expect(document.activeElement).toBe(drop));

        write.release();

        const restore = await settledControl(RESTORE_NAME);
        await waitFor(() => expect(document.activeElement).toBe(restore));
      },
    );

    it('should leave the focus alone on a later swap after a declined restore', async () => {
      holdRequest({ method: 'post', url: RESTORE_URL });
      renderComponent(DropMenu, { props: { show: DEVS_DROP_SHOW } });
      renderComponent(DropMenuHost, { props: { show: DEVS_DROP_SHOW } });
      await userEvent.click(await settledControl(RESTORE_NAME));
      await answerDialog('Restore this show?', 'No');

      const focused: Element[] = [];
      const recordFocus = ({ target }: FocusEvent) => {
        if (target instanceof Element) focused.push(target);
      };
      document.addEventListener('focusin', recordFocus);
      onTestFinished(() => {
        document.removeEventListener('focusin', recordFocus);
      });
      await userEvent.click(await settledControl('Restore'));
      await answerDialog('Restore this show?', 'Yes, restore it!');
      await screen.findByRole('button', {
        name: 'Flag show "Devs" as dropped',
      });
      await waitNegativeClaim();

      expect(
        focused.map((element) => element.getAttribute('aria-label')),
      ).not.toContain('Flag show "Devs" as dropped');
    });

    it('should leave the focus alone in a menu whose control did not have it', async () => {
      holdRequest({ method: 'post', url: DROP_URL });
      renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
      renderComponent(DropMenuHost, { props: { show: SILO_DROP_SHOW } });
      await openMenuFromKeyboard(await settledControl(DROP_NAME), 'Right now');

      await userEvent.keyboard('{Enter}');

      const restore = await screen.findByRole('button', {
        name: 'Restore show "Silo"',
      });
      await screen.findByRole('button', { name: 'Restore' });
      await waitFor(() => expect(document.activeElement).toBe(restore));
      await waitNegativeClaim();
      expect(document.activeElement).toBe(restore);
    });
  });
});
