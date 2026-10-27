const FALLBACK_UNIT_SUFFIX = {
  day: 'd',
  hour: 'h',
  minute: 'm',
} as const;

type FormattedUnit = keyof typeof FALLBACK_UNIT_SUFFIX;

type CreateUnitFormatterProps = {
  locale: string;
  unit: FormattedUnit;
  unitDisplay: Intl.NumberFormatOptions['unitDisplay'];
};

export function createUnitFormatter({
  locale,
  unit,
  unitDisplay,
}: CreateUnitFormatterProps): { format: (value: number) => string } {
  try {
    return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay });
  } catch {
    const decimal = new Intl.NumberFormat(locale);

    return {
      format: (value) =>
        `${decimal.format(value)}${FALLBACK_UNIT_SUFFIX[unit]}`,
    };
  }
}
