import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { Text, colors } from "../Themed";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ProductVariantListItemFragment } from "../../saleor/api.generated";
import { useCartContext } from "../../context/useCartContext";
import { useRouter } from "expo-router";
import { GlobalLoadingOverlay } from "../GlobalLoadingOverlay";
import { TripDetailsModal } from "./TripDetails/TripDetailsModal";
import { getOperatorChannelSlug } from "../../utils/attribute";
import { EllipsisLoader } from "../EllipsisLoader";
import {
  resolveProductLogoUrl,
  useOperatorLogo,
} from "../../hooks/useOperatorLogo";

interface Props {
  variant: ProductVariantListItemFragment;
}

function AmenityChipIcon({ slug }: { slug: string }) {
  const s = slug.toLowerCase();
  if (s.includes("wi-fi") || s.includes("wifi")) {
    return <Ionicons name="wifi" size={13} color={colors.grey500} />;
  }
  if (s.includes("climat") || s.includes("ac") || s.includes("air")) {
    return <Ionicons name="snow" size={13} color={colors.grey500} />;
  }
  if (s.includes("usb") || s.includes("prise")) {
    return <MaterialCommunityIcons name="usb" size={13} color={colors.grey500} />;
  }
  if (s.includes("toilet") || s.includes("toillet")) {
    return <MaterialCommunityIcons name="toilet" size={13} color={colors.grey500} />;
  }
  if (s.includes("tv") || s.includes("tele")) {
    return <Ionicons name="tv-outline" size={13} color={colors.grey500} />;
  }
  return (
    <Ionicons name="checkmark-circle-outline" size={13} color={colors.grey500} />
  );
}

function formatPriceLabel(amount?: number | null, currency?: string | null): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const cur = (currency || "XOF").toUpperCase() === "XOF" ? "FCFA" : currency || "";
  return `${Math.round(amount).toLocaleString("fr-FR")} ${cur}`.trim();
}

export const ProductElement = ({ variant }: Props) => {
  const attributes = variant.attributes || [];
  const [showDetails, setShowDetails] = useState(false);
  const { addItem } = useCartContext();
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handlePress = async () => {
    if (isActionLoading) return;

    const operatorChannelSlug = getOperatorChannelSlug(attributes);
    if (!operatorChannelSlug) {
      Alert.alert(
        "Erreur",
        "Impossible d'identifier la compagnie de ce trajet. Veuillez réessayer plus tard.",
      );
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await addItem(variant?.id, operatorChannelSlug);
      if (res) {
        router.push("/cart");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getAttrValue = (slug: string): string | undefined => {
    const found = attributes.find((attr) => attr.attribute?.slug === slug);
    return found?.values?.[0]?.name ?? found?.values?.[0]?.value ?? undefined;
  };

  const getAttrValues = (slug: string) => {
    const found = attributes.find((attr) => attr.attribute?.slug === slug);
    return found?.values;
  };

  const getProductAttrRaw = (slug: string): string | undefined => {
    const found = variant.product?.attributes?.find(
      (attr) => (attr.attribute?.slug || "").toLowerCase() === slug.toLowerCase(),
    );
    const v = found?.values?.[0];
    // Saleor often stores the number in `name` while `value` is "".
    const candidates = [v?.name, v?.value, v?.slug];
    for (const c of candidates) {
      const s = c?.toString().trim();
      if (s) return s;
    }
    return undefined;
  };

  const parseNumericAttr = (raw?: string): number | null => {
    if (!raw) return null;
    const match = raw.replace(",", ".").match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const n = Number(match[0]);
    return Number.isFinite(n) ? n : null;
  };

  const parseDurationToMinutes = (raw?: string): number => {
    if (!raw) return 0;
    const s = raw.trim().toLowerCase();
    const hmMatch = s.match(/(\d+)\s*h(?:ours?)?\s*(\d+)?/);
    if (hmMatch) {
      const h = parseInt(hmMatch[1], 10);
      const m = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
      return h * 60 + m;
    }
    const numMatch = s.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1], 10) : 0;
  };

  const formatMinutes = (mins: number): string | null => {
    if (!mins || mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h === 0 ? `${m}min` : `${h}h ${m.toString().padStart(2, "0")}m`;
  };

  const durationRaw = getAttrValue("estimated-duration");
  const company =
    getAttrValue("bus-operator") || variant.product?.name || "Compagnie";
  const departureStation = getAttrValue("departure-station");
  const arrivalStation = getAttrValue("arrival-station");
  const dateTime = getAttrValue("departure-time");
  const amenities = getAttrValues("amenities") ?? [];

  const departureDate = dateTime ? new Date(dateTime) : null;
  const durationMinutes = parseDurationToMinutes(durationRaw);
  const readableDuration = formatMinutes(durationMinutes);

  let arrivalTimeStr = "--:--";
  if (departureDate && durationMinutes > 0) {
    const arrivalDate = new Date(
      departureDate.getTime() + durationMinutes * 60_000,
    );
    arrivalTimeStr = arrivalDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const departureTimeStr = departureDate
    ? departureDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const price = variant.pricing?.price?.gross;
  const priceLabel = formatPriceLabel(price?.amount, price?.currency);
  const operatorChannelSlug = getOperatorChannelSlug(attributes);
  const logoUrl = useOperatorLogo({
    productLogoUrl: resolveProductLogoUrl(variant.product),
    operatorChannelSlug,
  });
  const amenityChips = amenities.filter((a) => (a?.name || a?.slug || "").trim());

  const bagagesIncluded = parseNumericAttr(getProductAttrRaw("bagages"));
  const cancellationHours = parseNumericAttr(getProductAttrRaw("cancellation"));

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => setShowDetails(true)}
        accessibilityRole="button"
        accessibilityLabel={`${company}, ${departureTimeStr} vers ${arrivalTimeStr}, ${priceLabel}. Voir les détails.`}
      >
        <View style={styles.header}>
          <View style={styles.companyRow}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.logo}
                resizeMode="cover"
                accessibilityLabel={`Logo ${company}`}
              />
            ) : (
              <View style={styles.logoFallback}>
                <MaterialCommunityIcons name="bus" size={18} color={colors.green} />
              </View>
            )}
            <Text style={styles.companyName} numberOfLines={1}>
              {company}
            </Text>
          </View>
          <Text style={styles.priceText}>{priceLabel}</Text>
        </View>

        <View style={styles.tripBody}>
          <View style={styles.column}>
            <Text style={styles.timeText}>{departureTimeStr}</Text>
            <Text style={styles.stationText} numberOfLines={2}>
              {departureStation?.split(",")[0] || "Départ"}
            </Text>
          </View>

          <View style={styles.centerColumn}>
            <View style={styles.arrowWrapper}>
              <View style={styles.line} />
              <View style={styles.durationContainer}>
                <Text style={styles.durationLabel}>
                  {readableDuration || "—"}
                </Text>
              </View>
              <View style={styles.line} />
              <View style={styles.arrowHead} />
            </View>
          </View>

          <View style={[styles.column, styles.columnEnd]}>
            <Text style={styles.timeText}>{arrivalTimeStr}</Text>
            <Text style={[styles.stationText, styles.stationEnd]} numberOfLines={2}>
              {arrivalStation?.split(",")[0] || "Arrivée"}
            </Text>
          </View>
        </View>

        {amenityChips.length > 0 ? (
          <View style={styles.chipRow}>
            {amenityChips.slice(0, 4).map((item, index) => {
              const label = (item.name || item.slug || "").trim();
              const slug = (item.slug || item.name || "").trim();
              return (
                <View key={`${slug}-${index}`} style={styles.chip}>
                  <AmenityChipIcon slug={slug} />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.detailsHint}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.green}
            />
            <Text style={styles.detailsHintText}>Détails</Text>
          </View>

          <TouchableOpacity
            style={[styles.bookButton, isActionLoading && { opacity: 0.7 }]}
            onPress={(e) => {
              e.stopPropagation?.();
              void handlePress();
            }}
            disabled={isActionLoading}
            accessibilityRole="button"
            accessibilityLabel="Réserver ce trajet"
          >
            {isActionLoading ? (
              <EllipsisLoader color="#FFFFFF" dotSize={6} />
            ) : (
              <Text style={styles.bookText}>Réserver</Text>
            )}
          </TouchableOpacity>
        </View>
      </Pressable>

      <GlobalLoadingOverlay
        visible={isActionLoading}
        companyName={company}
        destination={arrivalStation}
      />
      <TripDetailsModal
        isVisible={showDetails}
        onClose={() => setShowDetails(false)}
        onBook={handlePress}
        loading={isActionLoading}
        data={{
          departureTime: departureTimeStr,
          arrivalTime: arrivalTimeStr,
          departureStation: departureStation || "",
          arrivalStation: arrivalStation || "",
          duration: readableDuration || "",
          company,
          price: priceLabel,
          logoUrl,
          ameneties: amenities,
          bagagesIncluded,
          cancellationHours,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E3E7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardPressed: {
    opacity: 0.96,
    borderColor: "#CBD5E1",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#E8E9EC",
  },
  logoFallback: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCE8C8",
  },
  companyName: {
    flex: 1,
    fontSize: 14,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  priceText: {
    fontSize: 16,
    color: colors.green,
    fontFamily: "TTNormsPro-Bold",
  },
  tripBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  columnEnd: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 20,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    marginBottom: 2,
  },
  stationText: {
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 16,
  },
  stationEnd: {
    textAlign: "right",
  },
  centerColumn: {
    flex: 1.15,
    justifyContent: "center",
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  arrowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#CBD5E1",
  },
  durationContainer: {
    paddingHorizontal: 6,
  },
  durationLabel: {
    fontSize: 11,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
  },
  arrowHead: {
    width: 7,
    height: 7,
    borderTopWidth: 1.4,
    borderRightWidth: 1.4,
    borderColor: "#94A3B8",
    transform: [{ rotate: "45deg" }],
    marginLeft: -4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F7F7F8",
    borderWidth: 1,
    borderColor: "#E8E9EC",
    maxWidth: "48%",
  },
  chipText: {
    fontSize: 11,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    flexShrink: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF0F3",
  },
  detailsHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsHintText: {
    color: colors.green,
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  bookText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "TTNormsPro-Bold",
  },
});
