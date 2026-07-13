/** Shared logo asset and sizes for hero + launch splash (keep positions in sync). */
export const BRAND_LOGO = require("../../assets/images/logo.png");

/** Logo on the dashboard hero (final size). */
export const DASHBOARD_LOGO_WIDTH = 160;
export const DASHBOARD_LOGO_HEIGHT = 52;

/** Slightly larger logo on the launch splash before it settles on the hero. */
export const SPLASH_LOGO_WIDTH = 200;
export const SPLASH_LOGO_HEIGHT = 65;

/** Match `HeroHeader` / `HeroSearch` flex ratio. */
export const HERO_FLEX = 1;
export const SEARCH_FLEX = 1.2;

export const HERO_LOGO_ROW = {
  paddingLeft: 30,
  gap: 12,
} as const;
