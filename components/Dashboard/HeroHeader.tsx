import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../Themed";
import {
  DASHBOARD_LOGO_HEIGHT,
  DASHBOARD_LOGO_WIDTH,
  HERO_BANNER_HEIGHT,
} from "./dashboardBranding";

/** Deep brand green for logo contrast (derived from colors.green). */
const GREEN_DEEP = "#3D5A1A";

type Props = {
  /** Tablet landscape: fill the pane instead of a fixed phone banner height. */
  compact?: boolean;
};

const HeroHeader = ({ compact = false }: Props) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bannerHeight = compact
    ? undefined
    : HERO_BANNER_HEIGHT + insets.top;

  return (
    <View
      style={[
        styles.topHalf,
        compact ? styles.topHalfCompact : { height: bannerHeight },
        { backgroundColor: colors.green },
      ]}
    >
      <ImageBackground
        source={require("../../assets/images/hero-header.jpg")}
        style={[styles.heroBg, !compact && { width }]}
        imageStyle={styles.heroImage}
      >
        <LinearGradient
          colors={[
            `${GREEN_DEEP}EB`,
            `${colors.green}B8`,
            `${colors.green}47`,
            "transparent",
          ]}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
          pointerEvents="none"
        />
        <View
          style={[
            styles.logoRow,
            { paddingTop: compact ? 28 : insets.top + 8 },
            compact && styles.logoRowCompact,
          ]}
        >
          <Image
            source={require("../../assets/images/logo/1.png")}
            style={[styles.logo, compact && styles.logoCompact]}
            resizeMode="contain"
            accessibilityLabel="ChapChaTicket"
          />
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  topHalf: {
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topHalfCompact: {
    flex: 1,
    minHeight: 280,
    borderRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroBg: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
  },
  heroImage: {
    resizeMode: "cover",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  logoRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 1,
  },
  logoRowCompact: {
    flex: 1,
  },
  logo: {
    width: DASHBOARD_LOGO_WIDTH + 40,
    height: DASHBOARD_LOGO_HEIGHT + 12,
  },
  logoCompact: {
    width: DASHBOARD_LOGO_WIDTH + 80,
    height: DASHBOARD_LOGO_HEIGHT + 28,
  },
});

export default HeroHeader;
