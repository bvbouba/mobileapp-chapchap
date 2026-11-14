import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  View as RNView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { colors, Text, View } from "../Themed";
import { useCartContext } from "../../context/useCartContext";
import { getAttrValue, getOperatorChannelSlug, getTripInformation } from "../../utils/attribute";
import {
  resolveProductLogoUrl,
  useOperatorLogo,
} from "../../hooks/useOperatorLogo";
import { ensurePlatformFeeLineInCheckout, PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";
import {
  useCheckoutLinesAddMutation,
  useGetProductBySlugLazyQuery,
} from "../../saleor/api.generated";
import { EllipsisLoader } from "../EllipsisLoader";
import { PassengerModal } from "./PassengerModal";
import { useDeviceLayout } from "../../lib/layout/deviceLayout";

dayjs.locale("fr");

function formatPriceLabel(
  amount?: number | null,
  currency?: string | null,
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const cur =
    (currency || "XOF").toUpperCase() === "XOF" ? "FCFA" : currency || "";
  return `${Math.round(amount).toLocaleString("fr-FR")} ${cur}`.trim();
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function useReservationCountdown(expiresAt?: string | null) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(null);
      return;
    }

    const tick = () => {
      setRemainingMs(
        Math.max(0, new Date(expiresAt).getTime() - Date.now()),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remainingMs;
}

const TripArrow = ({ duration }: { duration: string }) => (
  <View style={styles.arrowWrapper}>
    <View style={styles.line} />
    <View style={styles.durationContainer}>
      <Text style={styles.durationLabel}>{duration}</Text>
    </View>
    <View style={styles.line} />
    <View style={styles.arrowHead} />
  </View>
);

const CartScreen = () => {
  const { cart, updateItemQuantity, loading, refreshCart } = useCartContext();
  const navigation = useRouter();
  const insets = useSafeAreaInsets();
  const { useTabletLayout, horizontalGutter } = useDeviceLayout();
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [checkoutNavigating, setCheckoutNavigating] = useState(false);

  const [fetchPlatformFeeProduct] = useGetProductBySlugLazyQuery();
  const [checkoutLinesAdd] = useCheckoutLinesAddMutation();

  const line = cart?.lines?.find(
    (l) => l?.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
  );
  const variant = line?.variant;
  const attributes = variant?.attributes || [];
  const passengerCount = line?.quantity ?? 1;
  const remainingMs = useReservationCountdown(
    cart?.stockReservationExpires ?? null,
  );

  const {
    departureCity,
    departureStation,
    arrivalCity,
    arrivalStation,
    company,
    departureTimeStr,
    readableDuration,
    arrivalTimeStr,
  } = getTripInformation({ attributes });

  const dateTime = getAttrValue(attributes, "departure-time");
  const displayDate = useMemo(() => {
    if (!dateTime) return "";
    const d = dayjs(dateTime).locale("fr");
    if (!d.isValid()) return "";
    const weekday = d.format("ddd");
    const weekdayFmt =
      weekday.charAt(0).toUpperCase() + weekday.slice(1).toLowerCase();
    return `${weekdayFmt} ${d.format("D MMM YYYY")}`;
  }, [dateTime]);

  const routeLabel = [departureCity, arrivalCity].filter(Boolean).join(" ➔ ");

  const companyLogoUrl = useOperatorLogo({
    productLogoUrl: resolveProductLogoUrl(variant?.product),
    operatorChannelSlug: getOperatorChannelSlug(attributes),
  });

  if (!cart || !line) {
    return (
      <View style={styles.emptyCartContainer}>
        <Ionicons name="cart-outline" size={80} color="#E2E8F0" />
        <Text style={styles.emptyCartText}>Votre panier est vide</Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.push("/")}
          activeOpacity={0.85}
        >
          <Text style={styles.goBackText}>Rechercher un trajet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalAmount = cart.totalPrice?.gross?.amount ?? 0;
  const currency = cart.totalPrice?.gross?.currency ?? "XOF";
  const ticketLineAmount = line?.totalPrice?.gross?.amount ?? null;
  const ticketPriceLabel = formatPriceLabel(
    ticketLineAmount,
    line?.totalPrice?.gross?.currency || currency,
  );
  const totalPriceLabel = formatPriceLabel(totalAmount, currency);
  const ticketWord = passengerCount > 1 ? "tickets" : "ticket";

  const handleUpdateQty = (newQty: number) => {
    if (newQty < 1 || !line?.id) return;
    updateItemQuantity(line.id, newQty);
  };

  const handleGoToCheckout = async () => {
    if (!cart?.id || loading || checkoutNavigating) return;
    setCheckoutNavigating(true);
    try {
      const feeResult = await ensurePlatformFeeLineInCheckout({
        checkoutId: cart.id,
        lines: cart.lines,
        channel: cart.channel?.slug ?? "",
        fetchProductBySlug: (args) => fetchPlatformFeeProduct(args),
        checkoutLinesAdd: (args) => checkoutLinesAdd(args),
        refreshCart,
      });

      if (!feeResult.ok && feeResult.reason === "mutation_error") {
        Alert.alert(
          "Erreur",
          feeResult.message ||
            "Impossible d'ajouter les frais de plateforme au panier.",
        );
        return;
      }

      navigation.push("/checkout");
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de continuer vers la validation.");
    } finally {
      setCheckoutNavigating(false);
    }
  };

  const checkoutBusy = loading || checkoutNavigating;
  const reservationExpired =
    remainingMs != null && remainingMs <= 0 && !!cart.stockReservationExpires;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.back()}
          style={styles.headerIconBtn}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={22} color="#000000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Ma Réservation ({passengerCount} {ticketWord})
        </Text>

        <View style={styles.headerIconBtn} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.content,
            useTabletLayout && {
              maxWidth: 720,
              alignSelf: "center",
              width: "100%",
              paddingHorizontal: horizontalGutter,
            },
          ]}
        >          <View style={styles.tripCard}>
            <View style={styles.companyRow}>
              {companyLogoUrl ? (
                <Image
                  source={{ uri: companyLogoUrl }}
                  style={styles.companyLogo}
                  accessibilityLabel={`Logo ${company || "compagnie"}`}
                />
              ) : (
                <View style={styles.companyIconFallback}>
                  <MaterialCommunityIcons
                    name="bus"
                    size={20}
                    color={colors.green}
                  />
                </View>
              )}
              <Text style={styles.companyName} numberOfLines={1}>
                {company || "Compagnie"}
              </Text>
            </View>

            <Text style={styles.routeText} numberOfLines={2}>
              {routeLabel || "Trajet"}
            </Text>

            <View style={styles.metaRow}>
              {displayDate ? (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={14}
                    color="#606060"
                  />
                  <Text style={styles.metaText}>{displayDate}</Text>
                </View>
              ) : null}
              <View style={styles.metaChip}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color="#606060"
                />
                <Text style={styles.metaText}>{departureTimeStr}</Text>
              </View>
            </View>

            <View style={styles.itineraryRow}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{departureTimeStr}</Text>
                <Text style={styles.stationText} numberOfLines={2}>
                  {departureStation || departureCity || "Départ"}
                </Text>
              </View>

              <View style={styles.centerColumn}>
                <TripArrow duration={readableDuration || ""} />
              </View>

              <View style={[styles.timeBox, styles.timeBoxEnd]}>
                <Text style={styles.timeText}>{arrivalTimeStr || "—"}</Text>
                <Text
                  style={[styles.stationText, styles.stationEnd]}
                  numberOfLines={2}
                >
                  {arrivalStation || arrivalCity || "Arrivée"}
                </Text>
              </View>
            </View>

            {remainingMs != null ? (
              <View
                style={[
                  styles.reservationBanner,
                  reservationExpired && styles.reservationBannerExpired,
                ]}
              >
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={16}
                  color={reservationExpired ? colors.primary : colors.green}
                />
                <Text
                  style={[
                    styles.reservationText,
                    reservationExpired && styles.reservationTextExpired,
                  ]}
                >
                  {reservationExpired
                    ? "Réservation expirée — reprenez un siège"
                    : `Siège bloqué pendant ${formatCountdown(remainingMs)}`}
                </Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.ticketRow}>
              <View style={styles.ticketLeft}>
                <MaterialCommunityIcons
                  name="ticket-confirmation-outline"
                  size={18}
                  color="#606060"
                />
                <View style={styles.ticketCopy}>
                  <Text style={styles.ticketLabel}>
                    {passengerCount} x Billet
                  </Text>
                  <TouchableOpacity
                    style={styles.addPassengerBtn}
                    onPress={() => setShowPassengerModal(true)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Ajouter un autre passager"
                  >
                    <Ionicons name="add" size={14} color={colors.green} />
                    <Text style={styles.addPassengerText}>
                      Ajouter un autre passager
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.ticketPrice}>{ticketPriceLabel}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total à régler</Text>
              <Text style={styles.totalValue}>{totalPriceLabel}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity
          style={[styles.checkoutBtn, checkoutBusy && { opacity: 0.7 }]}
          onPress={handleGoToCheckout}
          disabled={checkoutBusy || reservationExpired}
          accessibilityRole="button"
          accessibilityLabel="CONTINUER"
        >
          {checkoutBusy ? (
            <EllipsisLoader color="#FFFFFF" dotSize={7} />
          ) : (
            <RNView style={styles.checkoutBtnInner}>
              <Text style={styles.checkoutBtnText}>CONTINUER</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </RNView>
          )}
        </TouchableOpacity>
      </View>

      <PassengerModal
        isVisible={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        count={passengerCount}
        onConfirm={handleUpdateQty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E9EC",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    paddingHorizontal: 4,
  },
  scroll: { flex: 1, backgroundColor: "#F7F7F8" },
  content: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E3E7",
    padding: 16,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#E8E9EC",
  },
  companyIconFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F1F5EB",
    borderWidth: 1,
    borderColor: "#DCE8C8",
    alignItems: "center",
    justifyContent: "center",
  },
  companyName: {
    flex: 1,
    fontSize: 17,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  routeText: {
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    marginBottom: 8,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  itineraryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  timeBox: { flex: 1.1, minWidth: 0 },
  timeBoxEnd: { alignItems: "flex-end" },
  timeText: {
    fontSize: 20,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  stationText: {
    fontSize: 12,
    color: "#606060",
    marginTop: 4,
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 16,
  },
  stationEnd: { textAlign: "right" },
  centerColumn: {
    flex: 1.2,
    justifyContent: "center",
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  arrowWrapper: { flexDirection: "row", alignItems: "center", width: "100%" },
  line: { flex: 1, height: 1, backgroundColor: "#CBD5E1" },
  durationContainer: { paddingHorizontal: 4 },
  durationLabel: {
    fontSize: 10,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "lowercase",
  },
  arrowHead: {
    width: 6,
    height: 6,
    borderTopWidth: 1.2,
    borderRightWidth: 1.2,
    borderColor: "#CBD5E1",
    transform: [{ rotate: "45deg" }],
    marginLeft: -5,
  },
  reservationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F5EB",
    borderWidth: 1,
    borderColor: "#DCE8C8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  reservationBannerExpired: {
    backgroundColor: "#FFF1F0",
    borderColor: "#FFD4CF",
  },
  reservationText: {
    flex: 1,
    fontSize: 13,
    color: "#3F5A1E",
    fontFamily: "TTNormsPro-Bold",
  },
  reservationTextExpired: {
    color: colors.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E8E9EC",
    marginVertical: 14,
  },
  ticketRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  ticketLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    minWidth: 0,
  },
  ticketCopy: {
    flex: 1,
    minWidth: 0,
  },
  ticketLabel: {
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  ticketPrice: {
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  addPassengerBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    backgroundColor: "#F7F7F8",
  },
  addPassengerText: {
    fontSize: 12,
    color: colors.green,
    fontFamily: "TTNormsPro-Bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
  },
  totalValue: {
    fontSize: 18,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8E9EC",
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  checkoutBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
  },
  emptyCartText: {
    fontSize: 20,
    color: "#111111",
    marginTop: 20,
    fontFamily: "TTNormsPro-Bold",
  },
  goBackButton: {
    marginTop: 12,
    backgroundColor: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#D7D8DB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  goBackText: { color: colors.green, fontFamily: "TTNormsPro-Bold" },
});

export default CartScreen;
