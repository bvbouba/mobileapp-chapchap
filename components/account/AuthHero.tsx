import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, colors } from "../Themed";

interface Props {
  onOpenAuth: (mode: "login" | "signup") => void;
}

export const AuthHero = ({ onOpenAuth }: Props) => (
  <View style={styles.wrap}>
    <View style={styles.card}>
      {/* <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="account-circle-outline" size={36} color={colors.blue} />
      </View>
      <Text style={styles.title}>Bienvenue sur ChapTicket</Text>
      <Text style={styles.subtitle}>
        Connectez-vous pour synchroniser vos voyages, vos billets et vos informations de paiement.
      </Text> */}
      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        onPress={() => onOpenAuth("login")}
      >
        <Text style={styles.primaryBtnText}>Se connecter</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
      </Pressable>
      <Pressable style={styles.secondaryWrap} onPress={() => onOpenAuth("signup")}>
        <Text style={styles.secondaryText}>
          Pas encore de compte ? <Text style={styles.link}>Créer un compte</Text>
        </Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey300,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E6F5F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  primaryBtn: {
    backgroundColor: colors.red,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnPressed: { opacity: 0.92 },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
  },
  secondaryWrap: { marginTop: 16, paddingVertical: 4 },
  secondaryText: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    textAlign: "center",
  },
  link: { color: colors.blue, fontFamily: "TTNormsPro-Bold" },
});
