import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ConfirmationParams } from '../models/ConfirmationParams.ts';
import { ConfirmationType } from '../models/ConfirmationType.ts';
import { mapToConfirmation } from './mapToConfirmation.ts';

describe('mapToConfirmation', () => {
  it('should take a count for every type but the restore', () => {
    expectTypeOf<{ type: 'restore-show'; title: string }>()
      .toExtend<ConfirmationParams>();
    expectTypeOf<{ type: 'remove-from-history'; title: string }>().not
      .toExtend<ConfirmationParams>();
    expectTypeOf<{ type: 'mark-show-watched'; title: string }>().not
      .toExtend<ConfirmationParams>();
  });

  it('should ask to restore a show, its title as the body', () => {
    expect(
      mapToConfirmation({ type: ConfirmationType.RestoreShow, title: 'Devs' }),
    ).toEqual({
      title: 'Restore this show?',
      message: 'Devs',
      buttonText: 'Yes, restore it!',
      cancelText: 'No',
    });
  });
});
