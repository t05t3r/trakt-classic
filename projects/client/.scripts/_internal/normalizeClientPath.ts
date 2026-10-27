export function normalizeClientPath(path: string): string {
  return path.replace(/^\.(\/|$)/, '');
}
