import React, { useEffect, useState } from "react";
import { StyleSheet, View, Pressable, StatusBar, BackHandler } from "react-native";
import { Portal } from "react-native-paper";
import { Text, colors } from "../Themed";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export const LoginPrompt = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const openModal = (type: "login" | "signup") => {
    setMode(type);
    setModalVisible(true);
  };

  // Android back closes auth overlay (Portal is not a native Modal).
  useEffect(() => {
    if (!modalVisible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setModalVisible(false);
      return true;
    });
    return () => sub.remove();
  }, [modalVisible]);

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <Text style={styles.subtitle}>
          Connectez-vous ou créez un compte pour retrouver vos billets sur tous vos appareils.
        </Text>
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]}
            onPress={() => openModal("login")}
          >
            <Text style={styles.primaryText}>Se connecter</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryPressed]}
            onPress={() => openModal("signup")}
          >
            <Text style={styles.secondaryText}>Créer un compte</Text>
          </Pressable>
        </View>
      </View>

      {/*
        Portal (not nested Modal): country picker Modal can cover the full Android screen.
        Nested RN Modals do not reliably go fullscreen on Android.
      */}
      <Portal>
        {modalVisible ? (
          <View style={styles.authOverlay} accessibilityViewIsModal>
            <StatusBar barStyle="dark-content" />
            {mode === "login" ? (
              <LoginForm
                onClose={() => setModalVisible(false)}
                onSwitchToSignup={() => setMode("signup")}
              />
            ) : (
              <SignupForm
                onClose={() => setModalVisible(false)}
                onSwitchToLogin={() => setMode("login")}
              />
            )}
          </View>
        ) : null}
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    paddingVertical: 8,
  },
  authOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 1000,
    elevation: 1000,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey300,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  buttonContainer: { width: "100%", gap: 12 },
  primaryBtn: {
    backgroundColor: colors.red,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryPressed: { opacity: 0.92 },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontFamily: "TTNormsPro-Bold" },
  secondaryBtn: {
    backgroundColor: colors.grey100,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.grey300,
  },
  secondaryPressed: { opacity: 0.9 },
  secondaryText: { color: colors.text, fontSize: 16, fontFamily: "TTNormsPro-Bold" },
});
