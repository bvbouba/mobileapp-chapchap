import { useMemo } from "react";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const filterPlaceholder = {
  placeholder: "Entrez le nom du pays",
  autoFocus: true,
} as const;

/**
 * Country-picker props for PhoneInput.
 * Pads the header below the status bar on Android (library SafeAreaView ignores it
 * when the modal is statusBarTranslucent / edge-to-edge).
 */
export function usePhoneCountryPickerProps() {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    // Library uses RN SafeAreaView which does not pad Android when the modal
    // is translucent / edge-to-edge. iOS is already handled correctly.
    const topInset =
      Platform.OS === "android"
        ? Math.max(insets.top, StatusBar.currentHeight ?? 0)
        : 0;

    return {
      countryCodes: ["CI", "CA"] as ("CI" | "CA")[],
      translation: "fra" as const,
      withFilter: true,
      filterProps: {
        ...filterPlaceholder,
        ...(topInset > 0 ? { style: { marginTop: topInset } } : {}),
      },
      closeButtonStyle: topInset > 0 ? { marginTop: topInset } : undefined,
      modalProps: {
        animationType: "slide" as const,
        presentationStyle: "fullScreen" as const,
        statusBarTranslucent: Platform.OS === "android",
        hardwareAccelerated: true,
        ...(Platform.OS === "android"
          ? { navigationBarTranslucent: true }
          : {}),
      },
      flatListProps: {
        style: { flex: 1 },
        contentContainerStyle:
          insets.bottom > 0 ? { paddingBottom: insets.bottom } : undefined,
        keyboardShouldPersistTaps: "handled" as const,
      },
    };
  }, [insets.top, insets.bottom]);
}

/** Static filter props (placeholder only) when a hook is not needed. */
export const phoneInputFilterProps = filterPlaceholder;
