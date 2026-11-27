import { readHint } from '$lib/components/tooltip/hint.svelte.ts';
import { pendingOverrides } from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import type { DropStoreProps } from '$lib/features/media-actions/stores/useDrop.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { DEVS_DROP_SHOW } from '$mocks/data/media-actions/DEVS_DROP_SHOW.ts';
import { SILO_DROP_SHOW } from '$mocks/data/media-actions/SILO_DROP_SHOW.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { DROPPED_AT } from '$mocks/data/users/DROPPED_AT.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { waitForEnabled } from '$test/beds/buttons/waitForEnabled.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fixNow } from '$test/beds/date/fixNow.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { applyDateField } from '$test/beds/forms/applyDateField.ts';
import { DATE_FIELD_CLOSES } from '$test/beds/forms/DATE_FIELD_CLOSES.ts';
import { dateField } from '$test/beds/forms/dateField.ts';
import { dateFieldDialog } from '$test/beds/forms/dateFieldDialog.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { isMenuRowChecked } from '$test/beds/subnav/isMenuRowChecked.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { bodyUnlocked } from '$test/beds/scroll-lock/bodyUnlocked.ts';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, onTestFinished } from 'vitest';
import DropMenu from './DropMenu.svelte';

const DROP_NAME = 'Flag show "Silo" as dropped';
const RESTORE_NAME = 'Restore show "Devs"';

const trigger = () => screen.findByRole('button', { name: DROP_NAME });
const restoreDialog = () =>
  screen.queryByRole('dialog', { name: 'Restore this show?' });

// The control ignores a press until the dropped shows are known.
async function settledControl(
  name: string,
  container: HTMLElement = document.body,
) {
  return waitForEnabled(await within(container).findByRole('button', { name }));
}

const fieldDialog = () => dateFieldDialog('When did you drop this?');
const field = () => dateField('When did you drop this?');

// A write of this show from elsewhere, as another of its menus would start.
const holdDropOverride = (value: boolean) =>
  pendingOverrides.set({
    action: 'drop',
    targetKey: toTargetKey('show', SILO_DROP_SHOW.id),
    value,
    requestId: 'elsewhere',
  });

async function openField() {
  renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
  await userEvent.click(await settledControl(DROP_NAME));
  await waitFor(() => expect(field()).toHaveFocus());
}

// Drop from the keyboard: the icon opens the field, which applies its default, the current minute.
async function dropFromKeyboard(control: HTMLElement) {
  control.focus();
  await userEvent.keyboard('{Enter}');
  await waitFor(() => expect(field()).toHaveFocus());
  await applyDateField();
}

beforeEach(() => {
  stubClientRects();
});

describe('component: DropMenu', () => {
  it('should open the date field from its icon, its tooltip saying what it does, and write nothing', async () => {
    const writes = recordWrites();
    renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
    const icon = await settledControl(DROP_NAME);

    await userEvent.hover(icon);
    await waitFor(() => expect(icon).toHaveAccessibleDescription(DROP_NAME));
    expect(icon).not.toHaveAttribute('title');
    expect(icon.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(fieldDialog()).not.toBeInTheDocument();

    await userEvent.click(icon);

    await waitFor(() => expect(field()).toHaveFocus());
    await waitNegativeClaim();
    expect(writes).toEqual([]);
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
    expect(fieldDialog()).not.toBeInTheDocument();
  });

  it('should stay shut while the drop is saved', async () => {
    const saving = holdPost(DROP_URL);
    await openField();
    await applyDateField();
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

  describe('on Drop', () => {
    it('should send the current minute on Apply at the default', async () => {
      fixNow(new Date('2026-03-15T09:41:27.000Z'));
      const bodies = recordBodies(DROP_URL, { status: 201 });
      await openField();

      await applyDateField();

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{
            ids: { trakt: SILO_DROP_SHOW.id },
            hidden_at: '2026-03-15T09:41:00.000Z',
          }],
        }])
      );
      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
    });

    it('should send a past date on Apply', async () => {
      const bodies = recordBodies(DROP_URL, { status: 201 });
      await openField();

      await fireEvent.input(field(), { target: { value: '2026-01-15T12:00' } });
      await applyDateField();

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{
            ids: { trakt: SILO_DROP_SHOW.id },
            hidden_at: '2026-01-15T12:00:00.000Z',
          }],
        }])
      );
    });

    it('should write nothing for a future date and stay open', async () => {
      fixNow(new Date('2026-03-15T09:41:27.000Z'));
      const writes = recordWrites();
      await openField();

      await fireEvent.input(field(), { target: { value: '2026-03-15T09:42' } });
      await applyDateField();
      await waitNegativeClaim();

      expect(writes).toEqual([]);
      expect(fieldDialog()).toBeVisible();
    });

    // bits-ui drops a press made before its outside-press listener is on.
    const pressIconOpen = async () => {
      await openField();
      const icon = await trigger();
      await waitNegativeClaim();
      await userEvent.pointer({
        keys: '[MouseLeft>]',
        target: icon,
        coords: { clientX: 1, clientY: 1 },
      });
      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());

      return icon;
    };

    it('should close on a press on the icon and stay shut as the press ends, opening on the next', async () => {
      const icon = await pressIconOpen();

      await userEvent.pointer({ keys: '[/MouseLeft]', target: icon });
      fireEvent.click(icon, { detail: 1 });
      await waitNegativeClaim();
      expect(fieldDialog()).not.toBeInTheDocument();

      await userEvent.click(icon);
      await waitFor(() => expect(fieldDialog()).toBeInTheDocument());
    });

    it('should open from the keyboard after a press on the icon closed it', async () => {
      const icon = await pressIconOpen();

      icon.focus();
      await userEvent.keyboard('{Enter}');

      await waitFor(() => expect(fieldDialog()).toBeInTheDocument());
    });

    it('should say its icon opens a dialog, expanded while the field is open', async () => {
      renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
      const icon = await settledControl(DROP_NAME);
      expect(icon).toHaveAttribute('aria-haspopup', 'dialog');
      expect(icon).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(icon);
      await waitFor(() => expect(field()).toHaveFocus());
      expect(icon).toHaveAttribute('aria-expanded', 'true');

      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
      expect(icon).toHaveAttribute('aria-expanded', 'false');
    });

    it("should let the pointer through the icon's tooltip", async () => {
      renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });

      expect(readHint(await settledControl(DROP_NAME))?.isPassThrough)
        .toBe(true);
    });

    it('should keep the icon inert while the field is open', async () => {
      await openField();
      const icon = await trigger();

      expect(icon).toHaveAttribute('aria-disabled', 'true');

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());

      expect(icon).not.toHaveAttribute('aria-disabled');
    });

    it.each(DATE_FIELD_CLOSES)(
      'should return the focus to the icon on $name and write nothing',
      async ({ close }) => {
        const writes = recordWrites();
        await openField();

        await close();

        await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
        expect(await trigger()).toHaveFocus();
        await waitNegativeClaim();
        expect(writes).toEqual([]);
      },
    );

    it('should close, write nothing and focus Restore when the show turns dropped', async () => {
      const writes = recordWrites();
      await openField();

      holdDropOverride(true);

      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
      const restore = screen.getByRole('button', {
        name: 'Restore show "Silo"',
      });
      await waitFor(() => expect(restore).toHaveFocus());
      await waitNegativeClaim();
      expect(writes).toEqual([]);
    });

    it('should close, write nothing and focus the icon when a write leaves it inert', async () => {
      const writes = recordWrites();
      await openField();

      holdDropOverride(false);

      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
      expect(await trigger()).toHaveFocus();
      await waitNegativeClaim();
      expect(writes).toEqual([]);
    });

    it('should open no field and write nothing when a write leaves the icon inert', async () => {
      const writes = recordWrites();
      renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
      const icon = await settledControl(DROP_NAME);

      holdDropOverride(false);
      await waitFor(() =>
        expect(icon).toHaveAttribute('aria-disabled', 'true')
      );
      await userEvent.click(icon);
      await waitNegativeClaim();

      expect(fieldDialog()).not.toBeInTheDocument();
      expect(writes).toEqual([]);
    });

    it('should not reopen after an Apply whose write settles', async () => {
      const write = holdPost(DROP_URL, 500);
      await openField();

      await applyDateField();
      await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
      await write.requested;
      write.release();
      await settledControl(DROP_NAME);
      await waitNegativeClaim();

      expect(fieldDialog()).not.toBeInTheDocument();
    });

    it.each(REMOVALS)(
      'should hand the focus to Restore on Apply, where removal $removal',
      async ({ emulate }) => {
        emulate();
        holdRequest({ method: 'post', url: DROP_URL });
        await openField();

        await applyDateField();

        const restore = await screen.findByRole('button', {
          name: 'Restore show "Silo"',
        });
        await waitFor(() => expect(fieldDialog()).not.toBeInTheDocument());
        await waitFor(() => expect(document.activeElement).toBe(restore));
      },
    );

    it('should hand the focus back to Drop when a dated drop fails', async () => {
      const write = holdPost(DROP_URL, 500);
      await openField();
      await applyDateField();
      const restore = await screen.findByRole('button', {
        name: 'Restore show "Silo"',
      });
      await waitFor(() => expect(document.activeElement).toBe(restore));

      write.release();

      const drop = await settledControl(DROP_NAME);
      await waitFor(() => expect(document.activeElement).toBe(drop));
    });
  });

  describe('the status variant', () => {
    const renderStatus = (
      show: DropStoreProps,
      status: { isComplete: boolean; droppedAt?: Date },
    ) =>
      renderComponent(DropMenu, {
        props: { show, variant: 'status', status },
      });

    async function openStatus(name: string) {
      await userEvent.click(await settledControl(name));
      return screen.findByRole('menu', { name });
    }

    const statusDot = (button: HTMLElement) =>
      button.querySelector('.trakt-menu-glyph .drop-menu-status-dot');

    it.each(
      [
        {
          given: 'a show with episodes left',
          isComplete: false,
          status: 'Watching',
          dot: 'watching',
        },
        {
          given: 'a complete show',
          isComplete: true,
          status: 'Caught Up',
          dot: 'caught-up',
        },
      ] as const,
    )(
      'should name its button $status, with the $dot dot, for $given',
      async ({ isComplete, status, dot }) => {
        renderStatus(SILO_DROP_SHOW, { isComplete });
        const button = await settledControl(status);

        expect(button).toHaveTextContent(new RegExp(`^${status}$`));
        expect(statusDot(button)).toHaveAttribute('data-status', dot);
        expect(statusDot(button)).toHaveAttribute('aria-hidden', 'true');
      },
    );

    it("should check its status at the row's end, in the accent, then offer Drop", async () => {
      renderStatus(SILO_DROP_SHOW, { isComplete: false });
      await openStatus('Watching');

      const current = screen.getByRole('menuitemcheckbox', {
        name: 'Watching',
      });
      expect(current).toBeChecked();
      expect(isMenuRowChecked(current)).toBe(true);
      expect(current.querySelector('.trakt-menu-glyph .drop-menu-status-dot'))
        .toHaveAttribute('data-status', 'watching');
      expect(readMenuRows()).toEqual(['Drop']);
    });

    it('should open the date field on Drop and write nothing', async () => {
      const writes = recordWrites();
      renderStatus(SILO_DROP_SHOW, { isComplete: false });
      await openStatus('Watching');

      await userEvent.click(screen.getByRole('menuitem', { name: 'Drop' }));

      await waitFor(() => expect(field()).toHaveFocus());
      await waitNegativeClaim();
      expect(writes).toEqual([]);
    });

    it('should drop the show at the applied date', async () => {
      const bodies = recordBodies(DROP_URL, { status: 201 });
      renderStatus(SILO_DROP_SHOW, { isComplete: false });
      await openStatus('Watching');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Drop' }));
      await waitFor(() => expect(field()).toHaveFocus());

      await fireEvent.input(field(), { target: { value: '2026-01-15T12:00' } });
      await applyDateField();

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{
            ids: { trakt: SILO_DROP_SHOW.id },
            hidden_at: '2026-01-15T12:00:00.000Z',
          }],
        }])
      );
    });

    it('should read Dropped and keep the focus on its button while the drop is saved', async () => {
      holdRequest({ method: 'post', url: DROP_URL });
      renderStatus(SILO_DROP_SHOW, { isComplete: false });
      await openMenuFromKeyboard(await settledControl('Watching'), 'Watching');
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await waitFor(() => expect(field()).toHaveFocus());

      await applyDateField();

      const button = await screen.findByRole('button', { name: 'Dropped' });
      await waitFor(() => expect(button).toHaveFocus());
    });

    it('should read Dropped with a red dot, and its day once hydrated', async () => {
      renderStatus(DEVS_DROP_SHOW, {
        isComplete: false,
        droppedAt: DROPPED_AT,
      });
      const button = await settledControl('Dropped');

      expect(statusDot(button)).toHaveAttribute('data-status', 'dropped');

      emulateHydrated();

      await waitFor(() =>
        expect(button).toHaveAccessibleName('Dropped 1 Feb 2024')
      );
      expect(button).toHaveTextContent(/^Dropped 1 Feb 2024$/);
    });

    it('should offer Undrop for a dropped show and restore it once confirmed', async () => {
      const bodies = recordBodies(RESTORE_URL);
      renderStatus(DEVS_DROP_SHOW, { isComplete: false });
      await openStatus('Dropped');

      expect(screen.getByRole('menuitemcheckbox', { name: 'Dropped' }))
        .toBeChecked();
      expect(readMenuRows()).toEqual(['Undrop']);

      await userEvent.click(screen.getByRole('menuitem', { name: 'Undrop' }));
      await answerDialog('Restore this show?', 'Yes, restore it!');

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{ ids: { trakt: DEVS_DROP_SHOW.id } }],
        }])
      );
    });
  });

  describe('for a dropped show', () => {
    it('should offer Restore in place of Drop, its tooltip saying what it does', async () => {
      renderComponent(DropMenu, { props: { show: DEVS_DROP_SHOW } });
      const icon = await settledControl(RESTORE_NAME);

      await userEvent.hover(icon);
      await waitFor(() =>
        expect(icon).toHaveAccessibleDescription(RESTORE_NAME)
      );
      expect(icon).not.toHaveAttribute('title');
      expect(icon).not.toHaveAttribute('aria-haspopup');
      expect(icon.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(
        screen.queryByRole('button', { name: 'Flag show "Devs" as dropped' }),
      ).not.toBeInTheDocument();
    });

    it('should restore the show once the restore is confirmed', async () => {
      const bodies = recordBodies(RESTORE_URL);
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

    it('should keep Drop shut while the restore is saved', async () => {
      const saving = holdPost(RESTORE_URL, 200);
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
      expect(fieldDialog()).not.toBeInTheDocument();
    });
  });

  describe('across the swap of Drop and Restore', () => {
    it.each(REMOVALS)(
      'should hand the focus from Drop to Restore, where removal $removal',
      async ({ emulate }) => {
        emulate();
        holdRequest({ method: 'post', url: DROP_URL });
        renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });

        await dropFromKeyboard(await settledControl(DROP_NAME));

        const restore = await screen.findByRole('button', {
          name: 'Restore show "Silo"',
        });
        await waitFor(() => expect(document.activeElement).toBe(restore));
      },
    );

    it.each(REMOVALS)(
      'should hand the focus from Restore to Drop, where removal $removal',
      async ({ emulate }) => {
        emulate();
        holdRequest({ method: 'post', url: RESTORE_URL });
        renderComponent(DropMenu, { props: { show: DEVS_DROP_SHOW } });
        const control = await settledControl(RESTORE_NAME);
        control.focus();

        await userEvent.keyboard('{Enter}');
        await answerDialog('Restore this show?', 'Yes, restore it!');

        const drop = await screen.findByRole('button', {
          name: 'Flag show "Devs" as dropped',
        });
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
        const write = holdPost(DROP_URL, status);
        renderComponent(DropMenu, { props: { show: SILO_DROP_SHOW } });
        await dropFromKeyboard(await settledControl(DROP_NAME));
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
        const write = holdPost(RESTORE_URL, 500);
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
      const declined = renderComponent(DropMenu, {
        props: { show: DEVS_DROP_SHOW },
      });
      const accepted = renderComponent(DropMenu, {
        props: { show: DEVS_DROP_SHOW },
      });
      await userEvent.click(
        await settledControl(RESTORE_NAME, declined.container),
      );
      await answerDialog('Restore this show?', 'No');

      const focused: Element[] = [];
      const recordFocus = ({ target }: FocusEvent) => {
        if (target instanceof Element) focused.push(target);
      };
      document.addEventListener('focusin', recordFocus);
      onTestFinished(() => {
        document.removeEventListener('focusin', recordFocus);
      });
      await userEvent.click(
        await settledControl(RESTORE_NAME, accepted.container),
      );
      await answerDialog('Restore this show?', 'Yes, restore it!');
      const declinedDrop = await within(declined.container).findByRole(
        'button',
        { name: 'Flag show "Devs" as dropped' },
      );
      await waitNegativeClaim();

      expect(focused).not.toContain(declinedDrop);
    });

    it('should leave the focus alone in a menu whose control did not have it', async () => {
      holdRequest({ method: 'post', url: DROP_URL });
      const pressed = renderComponent(DropMenu, {
        props: { show: SILO_DROP_SHOW },
      });
      const other = renderComponent(DropMenu, {
        props: { show: SILO_DROP_SHOW },
      });

      await dropFromKeyboard(
        await settledControl(DROP_NAME, pressed.container),
      );

      const restore = await within(pressed.container).findByRole('button', {
        name: 'Restore show "Silo"',
      });
      await within(other.container).findByRole('button', {
        name: 'Restore show "Silo"',
      });
      await waitFor(() => expect(document.activeElement).toBe(restore));
      await waitNegativeClaim();
      expect(document.activeElement).toBe(restore);
    });
  });
});
