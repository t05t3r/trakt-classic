export function getLatestDate(
  dates: ReadonlyArray<Date | Nil>,
): Date | undefined {
  return dates.reduce<Date | undefined>((latest, date) => {
    if (!date) return latest;

    return latest && latest.getTime() >= date.getTime() ? latest : date;
  }, undefined);
}
