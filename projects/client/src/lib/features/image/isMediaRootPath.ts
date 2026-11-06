import { MEDIA_ART_SIZES } from './imageSizes.ts';

const AVATAR_PATH_PATTERN = /^users\/[1-9]\d{0,9}\/avatar\.webp\?v=[1-9]\d{9}$/;
const ROOT_ART_PATH_PATTERN = new RegExp(
  `^(?:movies|shows|seasons|episodes|people)/[1-9]\\d{0,9}/(?:${
    MEDIA_ART_SIZES.join('|')
  })/(?:poster|fanart|logo|thumb|screenshot|headshot)\\.webp$`,
);

export function isMediaRootPath(path: string): boolean {
  return AVATAR_PATH_PATTERN.test(path) || ROOT_ART_PATH_PATTERN.test(path);
}
