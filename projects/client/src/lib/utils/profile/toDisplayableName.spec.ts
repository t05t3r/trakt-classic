import { ExtendedUserSettingsMappedMock } from '$mocks/data/users/mapped/ExtendedUserSettingsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toDisplayableName } from './toDisplayableName.ts';

describe('toDisplayableName', () => {
  it('should return full name when it exists', () => {
    expect(toDisplayableName(ExtendedUserSettingsMappedMock)).toBe(
      ExtendedUserSettingsMappedMock.name.full,
    );
  });

  it('should return the plain username when full name is empty string', () => {
    const profile = {
      ...ExtendedUserSettingsMappedMock,
      name: {
        full: '',
      },
    };

    expect(toDisplayableName(profile)).toBe(profile.username);
  });
});
