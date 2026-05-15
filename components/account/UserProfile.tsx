import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, colors } from "../Themed";
import { UserDetailsFragment } from "../../saleor/api.generated";

interface Props {
  user: UserDetailsFragment | null;
}

export const UserProfile = ({ user }: Props) => {
  const initials = `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase();
  const phoneNumber = user?.email?.split("@")[0] || "";

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "?"}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.userName} numberOfLines={2}>
            {user?.firstName} {user?.lastName}
          </Text>
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone-outline" size={16} color={colors.grey500} />
            <Text style={styles.userPhone} numberOfLines={1}>
              {phoneNumber || "—"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey300,
    padding: 18,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E6F5F3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.blue,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: "TTNormsPro-Bold",
    color: colors.blue,
  },
  info: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  userPhone: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    flex: 1,
  },
});
