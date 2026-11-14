import { useMemo } from "react";
import { useWindowDimensions, PixelRatio, Platform } from "react-native";

/** Shortest edge ≥ this (dp) → treat as tablet / large layout. */
export const TABLET_MIN_SHORTEST_EDGE = 600;

/** Comfortable content width for single-column tablet screens. */
export const TABLET_CONTENT_MAX_WIDTH = 1100;

export type DeviceLayout = {
  width: number;
  height: number;
  isLandscape: boolean;
  /** Physical tablet detection; use this for orientation capabilities only. */
  isTablet: boolean;
  /** Tablet-specific UI is enabled only while a tablet is in landscape. */
  useTabletLayout: boolean;
  /** Prefer master–detail / dual panes (tablet landscape). */
  useSplitLayout: boolean;
  contentMaxWidth: number | undefined;
  horizontalGutter: number;
};

/**
 * Responsive layout flags for customer phone vs tablet.
 * Tablet chrome / split layouts apply only in landscape.
 */
export function useDeviceLayout(): DeviceLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const shortest = Math.min(width, height);
    const longest = Math.max(width, height);
    const shortestDp = shortest / Math.min(PixelRatio.getFontScale(), 1.25);
    const isTablet =
      shortestDp >= TABLET_MIN_SHORTEST_EDGE ||
      (Platform.OS === "ios" && shortest >= 768) ||
      (longest >= 900 && shortest >= 500);
    const isLandscape = width > height;
    const useTabletLayout = isTablet && isLandscape;
    const useSplitLayout = useTabletLayout;

    return {
      width,
      height,
      isLandscape,
      isTablet,
      useTabletLayout,
      useSplitLayout,
      contentMaxWidth: useTabletLayout ? TABLET_CONTENT_MAX_WIDTH : undefined,
      horizontalGutter: useTabletLayout ? 28 : 16,
    };
  }, [width, height]);
}
