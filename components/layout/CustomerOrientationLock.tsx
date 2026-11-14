import { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useDeviceLayout } from "../../lib/layout/deviceLayout";

/**
 * Phones stay portrait.
 * Tablets unlock so landscape tablet layouts can apply.
 */
export function CustomerOrientationLock() {
  const { isTablet } = useDeviceLayout();

  useEffect(() => {
    const run = async () => {
      try {
        if (isTablet) {
          await ScreenOrientation.unlockAsync();
          return;
        }
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      } catch {
        // Expo Go / unsupported native module — ignore
      }
    };
    void run();
  }, [isTablet]);

  return null;
}
