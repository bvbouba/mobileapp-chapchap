import React from "react";
import { StyleSheet, View, Pressable, Alert } from "react-native";
import { colors, Text } from "../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type MenuId = "contact" | "faq" | "about";

const MENU_ICONS: Record<MenuId, keyof typeof MaterialCommunityIcons.glyphMap> = {
  contact: "email-outline",
  faq: "help-circle-outline",
  about: "information-outline",
};

export const AccountMenu = ({ isAuthenticated, onLogout }: Props) => {
  const menuItems: { id: MenuId; title: string }[] = [
    { id: "contact", title: "Nous contacter" },
    { id: "faq", title: "FAQ" },
    { id: "about", title: "À propos" },
  ];

  const handleLogoutPress = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", onPress: onLogout, style: "destructive" },
    ]);
  };

  return (
    <View style={styles.card}>
      {menuItems.map((item, index) => {
        const showBorder = index < menuItems.length - 1 || isAuthenticated;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.item,
              showBorder && styles.borderBottom,
              pressed && styles.pressedItem,
            ]}
          >
            <View style={styles.itemLeft}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={MENU_ICONS[item.id]} size={20} color={colors.blue} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.grey300} />
          </Pressable>
        );
      })}

      {isAuthenticated ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.item, pressed && styles.pressedItem]}
          onPress={handleLogoutPress}
        >
          <View style={styles.itemLeft}>
            <View style={[styles.iconWrap, styles.logoutIconWrap]}>
              <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
            </View>
            <Text style={[styles.title, styles.logoutTitle]}>Déconnexion</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.grey300} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey300,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E6F5F3",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIconWrap: {
    backgroundColor: "#FEF2F2",
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grey300,
  },
  pressedItem: {
    backgroundColor: colors.grey100,
  },
  title: {
    fontSize: 15,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
  },
  logoutTitle: {
    color: colors.red,
  },
});
