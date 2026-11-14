import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors } from "../Themed";
import { useSafeHeaderInset } from "../../lib/layout/useSafeHeaderInset";

export const TABLET_NAV_RAIL_WIDTH = 92;

type RailItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  match: (path: string) => boolean;
};

/**
 * Left navigation rail for tablets in landscape (replaces the bottom tab bar).
 */
export function TabletNavRail() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const insets = useSafeAreaInsets();
  const headerTop = useSafeHeaderInset();

  const items = useMemo<RailItem[]>(
    () => [
      {
        key: "search",
        label: "Recherche",
        href: "/(tabs)/",
        icon: "magnify",
        match: (p) =>
          p === "/" ||
          p.endsWith("/(tabs)") ||
          p.endsWith("/(tabs)/") ||
          p.endsWith("/index") ||
          (p.includes("(tabs)") &&
            !p.includes("trips") &&
            !p.includes("account")),
      },
      {
        key: "trips",
        label: "Voyages",
        href: "/(tabs)/trips",
        icon: "ticket-confirmation-outline",
        match: (p) => p.includes("trips"),
      },
      {
        key: "account",
        label: "Profil",
        href: "/(tabs)/account",
        icon: "account-outline",
        match: (p) => p.includes("account"),
      },
    ],
    [],
  );

  const inactiveIcon = "#606060";
  const inactiveLabel = "#606060";

  return (
    <View
      style={[
        styles.rail,
        {
          width: TABLET_NAV_RAIL_WIDTH,
          paddingTop: headerTop + 4,
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: "#FFFFFF",
        },
      ]}
    >
      <View style={styles.brandDot}>
        <MaterialCommunityIcons name="bus" size={22} color={colors.primary} />
      </View>

      <View style={styles.items}>
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Pressable
              key={item.key}
              onPress={() => router.replace(item.href as never)}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={active ? colors.primary : inactiveIcon}
              />
              <Text
                style={[
                  styles.itemLabel,
                  { color: active ? colors.primary : inactiveLabel },
                  active && styles.itemLabelActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    alignItems: "center",
    paddingHorizontal: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#D7D8DB",
  },
  brandDot: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F1F1",
    marginBottom: 18,
  },
  items: {
    flex: 1,
    width: "100%",
    gap: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  itemActive: {
    backgroundColor: "rgba(235,23,0,0.08)",
  },
  itemLabel: {
    fontSize: 10,
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
  },
  itemLabelActive: {
    fontFamily: "TTNormsPro-Bold",
  },
});
