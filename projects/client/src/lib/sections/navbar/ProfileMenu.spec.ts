import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { ExtendedUserSettingsMappedMock } from '$mocks/data/users/mapped/ExtendedUserSettingsMappedMock.ts';
import { ExtendedUserSettingsResponseMock } from '$mocks/data/users/response/ExtendedUserSettingsResponseMock.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { fireEvent, screen, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import ProfileMenu from './ProfileMenu.svelte';

const MENU_NAME = "harrier_dubois's menu";

const trigger = () => screen.getByRole('button', { name: MENU_NAME });

const triggerImages = () =>
  Array.from(trigger().querySelectorAll('img')).map((img) =>
    img.getAttribute('src')
  );

const avatarTier = () =>
  trigger().querySelector('[data-tier]')?.getAttribute('data-tier');

// The trigger takes the username's name once the signed-in user has loaded.
const renderProfileMenu = async () => {
  renderComponent(ProfileMenu, { props: {} });
  await screen.findByRole('button', { name: MENU_NAME });
};

describe('component: ProfileMenu', () => {
  it("should link each row to the signed-in user's page", async () => {
    await renderProfileMenu();

    await fireEvent.click(trigger());

    expect(
      within(screen.getByRole('menu', { name: MENU_NAME }))
        .getAllByRole('menuitem')
        .map((row) => [row.textContent?.trim(), row.getAttribute('href')]),
    ).toEqual([
      ['History', '/users/me/history'],
      ['Progress', '/users/me/progress'],
      ['Ratings', '/users/me/ratings'],
      ['Lists', '/users/me/lists'],
      ['Sign Out', null],
    ]);
  });

  it('should sign out through a POST form to the logout endpoint', async () => {
    await renderProfileMenu();

    await fireEvent.click(trigger());

    const signOut = screen.getByRole('menuitem', { name: 'Sign Out' });
    const form = signOut.closest('form');

    expect(signOut).toHaveAttribute('type', 'submit');
    expect(form).toHaveAttribute('role', 'none');
    expect(form).toHaveAttribute('method', 'post');
    expect(form).toHaveAttribute('action', '/auth/logout');
  });

  it("should show the signed-in user's username and avatar on the trigger", async () => {
    await renderProfileMenu();

    expect(await within(trigger()).findByText('harrier_dubois'))
      .toBeInTheDocument();
    expect(triggerImages()).toEqual([
      PLACEHOLDERS.avatar,
      ExtendedUserSettingsMappedMock.avatar.url,
    ]);
  });

  it("should put the visible username in the trigger's accessible name", async () => {
    renderComponent(ProfileMenu, { props: {} });

    const name = await screen.findByText('harrier_dubois');
    const button = screen.getByRole('button');

    expect(button).toContainElement(name);
    expect(button).toHaveAccessibleName(
      expect.stringContaining('harrier_dubois'),
    );
  });

  it('should name the trigger Profile menu while the user loads', async () => {
    const settings = holdRequest({ method: 'get', url: USER_SETTINGS_URL });
    renderComponent(ProfileMenu, { props: {} });

    await settings.requested;

    expect(screen.getByRole('button')).toHaveAccessibleName('Profile menu');
  });

  it("should ring a VIP user's avatar as VIP", async () => {
    await renderProfileMenu();

    expect(avatarTier()).toBe('vip');
  });

  it("should ring a regular user's avatar as regular", async () => {
    server.use(
      http.get(USER_SETTINGS_URL, () =>
        HttpResponse.json({
          ...ExtendedUserSettingsResponseMock,
          user: {
            ...ExtendedUserSettingsResponseMock.user,
            vip: false,
            vip_ep: false,
          },
        })),
    );
    await renderProfileMenu();

    expect(avatarTier()).toBe('regular');
  });
});
