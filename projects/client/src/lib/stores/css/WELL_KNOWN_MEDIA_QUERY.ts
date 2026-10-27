import {
  breakpointDesktop,
  breakpointMobile,
  breakpointTabletLgMax,
  breakpointTabletLgMin,
  breakpointTabletSmMax,
  breakpointTabletSmMin,
} from '$style/scss/variables/index.ts';

export const WELL_KNOWN_MEDIA_QUERY = {
  mobile: `(max-width: ${breakpointMobile})`,
  tabletSmall:
    `(min-width: ${breakpointTabletSmMin}) and (max-width: ${breakpointTabletSmMax})`,
  tabletSmallAndBelow: `(max-width: ${breakpointTabletSmMax})`,
  tabletLarge:
    `(min-width: ${breakpointTabletLgMin}) and (max-width: ${breakpointTabletLgMax})`,
  desktop: `(min-width: ${breakpointDesktop})`,
  mouse: '(hover: hover) and (pointer: fine)',
  touch: '(hover: none) and (pointer: coarse)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
};
