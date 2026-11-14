import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, colors } from "../../Themed";

export type TripAmenity = {
  __typename?: "AttributeValue";
  name?: string | null;
  slug?: string | null;
  value?: string | null;
};

export type TripDetailsData = {
  departureTime: string;
  arrivalTime: string;
  departureStation: string;
  arrivalStation: string;
  duration: string;
  company: string;
  price: string;
  logoUrl?: string | null;
  ameneties?: TripAmenity[];
  /** Included bags count from product attribute `bagages`. */
  bagagesIncluded?: number | null;
  /**
   * Free cancellation window in hours from product attribute `cancellation`.
   * `0` = no cancellation; `null` = unknown / not set.
   */
  cancellationHours?: number | null;
};

type Props = {
  data: TripDetailsData;
};

const AmenityIcon = ({ slug, name }: { slug: string; name?: string }) => {
  const key = `${slug} ${name || ""}`.toLowerCase();
  if (key.includes("wi-fi") || key.includes("wifi")) {
    return <Ionicons name="wifi" size={14} color={colors.green} />;
  }
  if (key.includes("climat") || key.includes(" a/c") || key.includes("ac ")) {
    return <Ionicons name="snow" size={14} color={colors.green} />;
  }
  if (key.includes("usb") || key.includes("prise")) {
    return <MaterialCommunityIcons name="usb" size={14} color={colors.green} />;
  }
  if (key.includes("toilet") || key.includes("toillet")) {
    return <MaterialCommunityIcons name="toilet" size={14} color={colors.green} />;
  }
  if (key.includes("tv") || key.includes("tele") || key.includes("écran")) {
    return <Ionicons name="tv-outline" size={14} color={colors.green} />;
  }
  if (key.includes("bagage")) {
    return <MaterialCommunityIcons name="bag-suitcase-outline" size={14} color={colors.green} />;
  }
  return <Ionicons name="checkmark-circle-outline" size={14} color={colors.green} />;
};

function cancellationCopy(hours: number | null | undefined): string | null {
  if (hours == null || !Number.isFinite(hours)) return null;
  if (hours <= 0) {
    return "Aucune annulation possible pour ce trajet.";
  }
  const h = Math.round(hours);
  return `Annulation gratuite jusqu'à ${h}h avant le départ (Avoir).`;
}

export const TripDetailsContent = ({ data }: Props) => {
  const amenitiesList = data.ameneties || [];
  const bags =
    data.bagagesIncluded != null && Number.isFinite(data.bagagesIncluded)
      ? Math.max(0, Math.round(data.bagagesIncluded))
      : null;
  const cancelText = cancellationCopy(data.cancellationHours);

  const serviceChips: Array<{ key: string; label: string; slug: string }> = [
    ...amenitiesList
      .map((item, index) => {
        const label = (item.name || item.slug || "").trim();
        if (!label) return null;
        return {
          key: `amenity-${item.slug || index}`,
          label,
          slug: item.slug || label,
        };
      })
      .filter((x): x is { key: string; label: string; slug: string } => !!x),
  ];

  if (bags != null && bags > 0) {
    serviceChips.push({
      key: "bagages",
      label: `${bags} bagage${bags > 1 ? "s" : ""} inclus`,
      slug: "bagages",
    });
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.infoCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="map-marker-path" size={16} color={colors.green} />
          <Text style={styles.sectionTitle}>Itinéraire</Text>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.timeline}>
            <View style={[styles.dot, styles.dotStart]} />
            <View style={styles.line} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTime}>{data.departureTime}</Text>
            <Text style={styles.stepStation}>{data.departureStation || "Départ"}</Text>
          </View>
        </View>

        <View style={styles.durationRow}>
          <View style={styles.timelineSpacer} />
          <View style={styles.durationPill}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#606060" />
            <Text style={styles.durationText}>
              Durée estimée : {data.duration || "—"}
            </Text>
          </View>
        </View>

        <View style={[styles.stepRow, { minHeight: 56 }]}>
          <View style={styles.timeline}>
            <View style={[styles.dot, styles.dotEnd]} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTime}>{data.arrivalTime}</Text>
            <Text style={styles.stepStation}>{data.arrivalStation || "Arrivée"}</Text>
          </View>
        </View>
      </View>

      {serviceChips.length > 0 ? (
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="toolbox-outline" size={16} color={colors.green} />
            <Text style={styles.sectionTitle}>Services à bord & conditions</Text>
          </View>
          <View style={styles.amenitiesGrid}>
            {serviceChips.map((item) => (
              <View key={item.key} style={styles.amenityItem}>
                <AmenityIcon slug={item.slug} name={item.label} />
                <Text style={styles.amenityText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {cancelText ? (
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.green} />
            <Text style={styles.sectionTitle}>Politique d&apos;annulation</Text>
          </View>
          <Text style={styles.policyText}>• {cancelText}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollArea: { flex: 1 },
  scrollContent: {
    paddingBottom: 16,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E9EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 64,
  },
  timeline: {
    width: 22,
    alignItems: "center",
    position: "relative",
  },
  timelineSpacer: {
    width: 22,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  dotStart: {
    backgroundColor: colors.green,
  },
  dotEnd: {
    backgroundColor: colors.primary,
  },
  line: {
    width: 2,
    position: "absolute",
    top: 16,
    bottom: -18,
    backgroundColor: "#D7D8DB",
  },
  stepContent: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 8,
  },
  stepTime: {
    fontSize: 18,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  stepStation: {
    marginTop: 2,
    fontSize: 14,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: -4,
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F7F7F8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E8E9EC",
  },
  durationText: {
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap" },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7D8DB",
    backgroundColor: "#F8FAFB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#404040",
    fontFamily: "TTNormsPro-Regular",
  },
  policyText: {
    fontSize: 13,
    color: "#404040",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 20,
  },
});
