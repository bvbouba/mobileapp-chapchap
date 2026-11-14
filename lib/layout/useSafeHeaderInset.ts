import { useMemo } from "react";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Top inset for headers / floating controls.
 * On some Android tablets (esp. landscape), `insets.top` can be 0 while the
 * status bar still covers the top.
 */
export function useSafeHeaderInset(minExtra = 0): number {
  const insets = useSafeAreaInsets();
  return useMemo(() => {
    const androidStatus =
      Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
    const floor = Platform.OS === "android" ? 24 : 12;
    return Math.max(insets.top, androidStatus, floor) + minExtra;
  }, [insets.top, minExtra]);
}
