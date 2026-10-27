import { IMAGE_PATH_SIZES } from './imageSizes.ts';

const imagePathPattern =
  /^(?:[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|gif)(?:\.webp)?|[A-Za-z0-9_-]+\.)$/i;
const imageSizes = new Set<string>(IMAGE_PATH_SIZES);

export function isImagePath(path: string): boolean {
  const segments = path.split('/');

  if (path.length > 200 || segments.length !== 7) return false;
  if (
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) return false;

  const [kind, ...rest] = segments;
  const shard = rest.slice(0, 3);
  const [art, size, filename] = rest.slice(3);

  return Boolean(kind && /^[a-z_]+$/.test(kind)) &&
    shard.every((segment) => /^\d{3}$/.test(segment ?? '')) &&
    Boolean(art && /^[a-z_]+$/.test(art)) &&
    imageSizes.has(size ?? '') && imagePathPattern.test(filename ?? '');
}
