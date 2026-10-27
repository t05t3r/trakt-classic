import * as m from '$lib/features/i18n/messages.ts';

// A Map, so a name such as 'constructor' cannot reach Object.prototype.
const CERTIFICATION_TEXT: ReadonlyMap<string, () => string> = new Map([
  ['G', m.text_certification_g],
  ['PG', m.text_certification_pg],
  ['PG-13', m.text_certification_pg_13],
  ['R', m.text_certification_r],
  ['NR', m.text_certification_nr],
  ['TV-Y', m.text_certification_tv_y],
  ['TV-Y7', m.text_certification_tv_y7],
  ['TV-G', m.text_certification_tv_g],
  ['TV-PG', m.text_certification_tv_pg],
  ['TV-14', m.text_certification_tv_14],
  ['TV-MA', m.text_certification_tv_ma],
]);

export function toCertificationText(name: string): string | undefined {
  return CERTIFICATION_TEXT.get(name)?.();
}
