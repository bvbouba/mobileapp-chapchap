import { Image, type ImageStyle, type StyleProp, StyleSheet } from "react-native";
import { BRAND_LOGO } from "./dashboardBranding";

type Props = {
  width: number;
  height: number;
  style?: StyleProp<ImageStyle>;
};

/** White logo used on the hero and launch splash. */
export function HeroBrandLogo({ width, height, style }: Props) {
  return (
    <Image
      source={BRAND_LOGO}
      style={[styles.logo, { width, height }, style]}
      resizeMode="contain"
      accessibilityLabel="ChapChapTicket"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    maxWidth: "100%",
  },
});
