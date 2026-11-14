/** Shared logo asset and sizes for hero + launch splash (keep positions in sync). */
export const BRAND_LOGO = require("../../assets/images/logo.png");

/** Logo on the dashboard hero (final size). */
export const DASHBOARD_LOGO_WIDTH = 150;
export const DASHBOARD_LOGO_HEIGHT = 48;

/** Slightly larger logo on the launch splash before it settles on the hero. */
export const SPLASH_LOGO_WIDTH = 180;
export const SPLASH_LOGO_HEIGHT = 58;

/**
 * Compact hero banner height (content area below status bar).
 * Search form should sit in the first viewport without scrolling.
 */
export const HERO_BANNER_HEIGHT = 148;

/** @deprecated Prefer HERO_BANNER_HEIGHT — kept for splash layout ratios. */
export const HERO_FLEX = 0.55;
export const SEARCH_FLEX = 1.45;

export const HERO_LOGO_ROW = {
  paddingLeft: 24,
  gap: 8,
} as const;
