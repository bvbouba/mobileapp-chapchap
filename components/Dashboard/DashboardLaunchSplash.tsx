import { useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";
import { Text } from "../Themed";
import { HeroBrandLogo } from "./HeroBrandLogo";
import {
  DASHBOARD_LOGO_HEIGHT,
  DASHBOARD_LOGO_WIDTH,
  HERO_FLEX,
  HERO_LOGO_ROW,
  SEARCH_FLEX,
  SPLASH_LOGO_HEIGHT,
  SPLASH_LOGO_WIDTH,
} from "./dashboardBranding";

type Props = {
  onFinish: () => void;
};

/**
 * In-app launch splash: same hero layout as the dashboard, logo in the same spot,
 * then a short shrink into the final hero size.
 *
 * Custom native splash from app.config does not appear in Expo Go — only in a dev
 * client or store build. This overlay gives the same experience during local testing.
 */
export function DashboardLaunchSplash({ onFinish }: Props) {
  const [visible, setVisible] = useState(true);
  const [logoSize, setLogoSize] = useState({
    width: SPLASH_LOGO_WIDTH,
    height: SPLASH_LOGO_HEIGHT,
  });
  const logoWidth = useRef(new Animated.Value(SPLASH_LOGO_WIDTH)).current;
  const logoHeight = useRef(new Animated.Value(SPLASH_LOGO_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    const onWidth = logoWidth.addListener(({ value }) => {
      setLogoSize((s) => ({ ...s, width: value }));
    });
    const onHeight = logoHeight.addListener(({ value }) => {
      setLogoSize((s) => ({ ...s, height: value }));
    });
    return () => {
      logoWidth.removeListener(onWidth);
      logoHeight.removeListener(onHeight);
    };
  }, [logoHeight, logoWidth]);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(280),
      Animated.parallel([
        Animated.timing(logoWidth, {
          toValue: DASHBOARD_LOGO_WIDTH,
          duration: 520,
          useNativeDriver: false,
        }),
        Animated.timing(logoHeight, {
          toValue: DASHBOARD_LOGO_HEIGHT,
          duration: 520,
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(80),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (!finished || finishedRef.current) return;
      finishedRef.current = true;
      setVisible(false);
      onFinish();
    });

    return () => animation.stop();
  }, [logoHeight, logoWidth, onFinish, overlayOpacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="none"
    >
      <View style={styles.container}>
        <View style={styles.topHalf}>
          <ImageBackground
            source={require("../../assets/images/hero-header.jpg")}
            style={styles.heroBg}
            imageStyle={styles.heroImage}
          >
            <View style={styles.overlayTint} />
            <View style={styles.logoRow}>
              <HeroBrandLogo width={logoSize.width} height={logoSize.height} />
              <View style={styles.taglineCol}>
                <Text style={styles.tagline}>Voyagez simple, voyagez vite</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
        <View style={styles.bottomHalf} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topHalf: {
    flex: HERO_FLEX,
    backgroundColor: "#EB1700",
    overflow: "hidden",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bottomHalf: {
    flex: SEARCH_FLEX,
    backgroundColor: "#FFFFFF",
  },
  heroBg: {
    flex: 1,
    justifyContent: "center",
  },
  heroImage: {
    resizeMode: "cover",
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.14)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: HERO_LOGO_ROW.paddingLeft,
    gap: HERO_LOGO_ROW.gap,
  },
  taglineCol: {
    flex: 1,
    justifyContent: "center",
  },
  tagline: {
    color: "#F1F1F1",
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
  },
});
