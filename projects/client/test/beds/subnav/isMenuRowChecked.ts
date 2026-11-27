import { assertDefined } from '$lib/utils/assert/assertDefined.ts';

// True while the menu row in `scope` takes the accent of a checked row; throws
// with no row, so a row that is not checked must exist.
export function isMenuRowChecked(scope: ParentNode): boolean {
  const row = assertDefined(
    scope.querySelector('.trakt-menu-row'),
    'No menu row in scope',
  );

  return row.classList.contains('is-checked');
}
