import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../Themed";

export const ConfirmationHeader = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goHome = () => {
    router.replace("/");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Pressable
          onPress={goHome}
          style={styles.homeBtn}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
        >
          <Ionicons name="home-outline" size={20} color="#111111" />
          <Text style={styles.homeLabel}>Accueil</Text>
        </Pressable>
        <View style={styles.spacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E9EC",
  },
  content: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#F7F7F8",
    borderWidth: 1,
    borderColor: "#E2E3E7",
  },
  homeLabel: {
    fontSize: 14,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  spacer: { width: 36 },
});
