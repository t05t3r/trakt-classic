export function getLatestDate(dates: ReadonlyArray<Date>): Date | undefined {
  return dates.reduce<Date | undefined>(
    (latest, date) =>
      latest && latest.getTime() >= date.getTime() ? latest : date,
    undefined,
  );
}
