import process from 'node:process';
import { onTestFinished } from 'vitest';

// Registers the restore first, so a call outside a test throws before the zone changes.
export function setTimeZone(zone: string): void {
  const found = process.env.TZ;
  onTestFinished(() => restoreTimeZone(found));
  process.env.TZ = zone;
}

// Assigning undefined to process.env stores the string 'undefined'.
function restoreTimeZone(found: string | undefined): void {
  if (found === undefined) {
    delete process.env.TZ;
    return;
  }

  process.env.TZ = found;
}
