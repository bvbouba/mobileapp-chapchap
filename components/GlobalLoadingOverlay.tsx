import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Image,
  Animated,
  BackHandler,
  Platform,
} from "react-native";
import { Text, colors } from "./Themed";
import { EllipsisLoader } from "./EllipsisLoader";

interface Props {
  visible: boolean;
  companyName?: string | null;
  destination?: string | null;
}

function buildSubtitle(
  companyName?: string | null,
  destination?: string | null,
): string {
  const company = companyName?.trim();
  const dest = destination?.trim();

  if (dest && company) {
    return `Réservation de votre siège pour ${dest} chez ${company}...`;
  }
  if (company) {
    return `Nous bloquons votre siège chez ${company}...`;
  }
  if (dest) {
    return `Réservation de votre siège pour ${dest}...`;
  }
  return "Réservation de votre siège en cours...";
}

export const GlobalLoadingOverlay = ({
  visible,
  companyName,
  destination,
}: Props) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  // Block Android hardware back while availability is being checked.
  useEffect(() => {
    if (!visible || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      // Keep the overlay non-dismissible until the check finishes.
      onRequestClose={() => {}}
    >
      <View style={styles.modalRoot} pointerEvents="box-only">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Animated.View
              style={[styles.logoCircle, { transform: [{ scale: pulse }] }]}
            >
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.brandImg}
                accessibilityLabel="ChapChap"
              />
            </Animated.View>

            <View style={styles.dotsWrap}>
              <EllipsisLoader color={colors.primary} dotSize={7} />
            </View>

            <Text style={styles.title}>Vérification de la disponibilité...</Text>
            <Text style={styles.subtitle}>
              {buildSubtitle(companyName, destination)}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E9EC",
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E9EC",
    overflow: "hidden",
    marginBottom: 16,
  },
  brandImg: {
    width: 88,
    height: 88,
    resizeMode: "contain",
  },
  dotsWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    color: "#111111",
    marginBottom: 8,
    fontFamily: "TTNormsPro-Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#606060",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "TTNormsPro-Regular",
    paddingHorizontal: 4,
  },
});
