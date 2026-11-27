export function barRuns(
  container: HTMLElement,
): ReadonlyArray<{ isFilled: boolean; length: string }> {
  return [...container.querySelectorAll<HTMLElement>('.progress-run')].map(
    (run) => ({
      isFilled: run.classList.contains('is-filled'),
      length: run.style.getPropertyValue('--run-length'),
    }),
  );
}
