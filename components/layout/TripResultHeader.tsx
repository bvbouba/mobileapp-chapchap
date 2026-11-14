import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useRouter, useGlobalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors } from "../Themed";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatFrenchShortTripDate } from "../../utils/attribute";

const TripResultHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { originName, destinationName, date } = useGlobalSearchParams<{
    originName: string;
    destinationName: string;
    date: string;
  }>();

  const formatRouteDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!y || !m || !d) return dateStr;
      return formatFrenchShortTripDate(new Date(y, m - 1, d));
    } catch {
      return dateStr;
    }
  };

  const displayDate = formatRouteDate(date);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={20} color="#000000" />
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.routeRow}>
            <Text style={styles.cityText} numberOfLines={1}>
              {originName || "Départ"}
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={16}
              color={colors.green}
              style={{ marginHorizontal: 6 }}
            />
            <Text style={styles.cityText} numberOfLines={1}>
              {destinationName || "Arrivée"}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {displayDate ? `Départ ${displayDate}` : "Date non sélectionnée"}
          </Text>
        </View>

        {/* Balance spacer with back button */}
        <View style={styles.iconButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E9EC",
  },
  container: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    minWidth: 0,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },
  cityText: {
    flexShrink: 1,
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "capitalize",
  },
  dateText: {
    fontSize: 12,
    color: "#606060",
    marginTop: 2,
    fontFamily: "TTNormsPro-Regular",
  },
});

export default TripResultHeader;
