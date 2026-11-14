import React, { useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { useOrder } from "../checkout/hooks/useOrder";
import { Text, colors } from "../components/Themed";
import { getConfirmationCode } from "../utils/generateShortCode";
import { getTripInformation } from "../utils/attribute";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../utils/ensurePlatformFeeInCheckout";
import { EllipsisLoader } from "../components/EllipsisLoader";

dayjs.locale("fr");

function formatMoney(amount?: number | null, currency?: string | null): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const cur =
    (currency || "XOF").toUpperCase() === "XOF" ? "FCFA" : currency || "";
  return `${Math.round(amount).toLocaleString("fr-FR")} ${cur}`.trim();
}

function formatLongFrenchDate(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return "";
  const raw = dayjs(d).locale("fr").format("dddd D MMMM YYYY");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const OrderConfirmation = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { order, loading } = useOrder();

  const tripLine = useMemo(() => {
    if (!order?.lines?.length) return null;
    return (
      order.lines.find(
        (l) => l?.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
      ) ?? order.lines[0]
    );
  }, [order]);

  const tripInfo = useMemo(
    () =>
      getTripInformation({
        attributes: (tripLine?.variant?.attributes || []) as any,
      }),
    [tripLine],
  );

  if (loading && !order) {
    return (
      <View style={styles.center}>
        <EllipsisLoader color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Commande introuvable</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/")}>
          <Text style={styles.primaryBtnText}>Retour à l&apos;accueil</Text>
        </Pressable>
      </View>
    );
  }

  const confirmationCode = getConfirmationCode(order);
  const ticketCount = order.lines
    .filter((l) => l?.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG)
    .reduce((sum, l) => sum + (l.quantity || 0), 0);
  const ticketWord = ticketCount > 1 ? "Billets" : "Billet";
  const routeStations = [
    tripInfo.departureStation || tripInfo.departureCity,
    tripInfo.arrivalStation || tripInfo.arrivalCity,
  ]
    .filter(Boolean)
    .join(" ➔ ");
  const longDate = formatLongFrenchDate(tripInfo.departureDate);
  const paidAmount = formatMoney(
    order.total?.gross?.amount,
    order.total?.gross?.currency,
  );

  const goToTrips = () => {
    router.replace("/(tabs)/trips");
  };

  const goHome = () => {
    router.replace("/");
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.statusIcon}>
            <MaterialCommunityIcons
              name="timer-sand"
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.heroTitle}>Commande envoyée</Text>
          <Text style={styles.heroSubtitle}>
            Nous attendons la confirmation finale de{" "}
            {tripInfo.company || "la compagnie"}.
          </Text>
          <View style={styles.codeChip}>
            <Text style={styles.codeLabel}>N° de réservation</Text>
            <Text style={styles.codeValue}>#{confirmationCode}</Text>
            <Text style={styles.codeBrand}>ChapChap</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Que va-t-il se passer ?</Text>
          </View>
          <Text style={styles.stepText}>
            1. {tripInfo.company || "La compagnie"} confirme votre place.
          </Text>
          <Text style={styles.stepText}>
            2. Votre e-billet sera activé dans « Mes Voyages ».
          </Text>
          <Text style={styles.stepText}>
            3. Votre QR Code de bord sera disponible automatiquement.
          </Text>
        </View>

        <View style={[styles.card, styles.guichetCard]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={18}
              color="#3F5A1E"
            />
            <Text style={[styles.cardTitle, { color: "#3F5A1E" }]}>
              Billet physique au guichet
            </Text>
          </View>
          <Text style={styles.guichetBody}>
            Si vous le souhaitez, vous pouvez aussi retirer votre billet papier au
            guichet de la gare avant l&apos;embarquement en présentant votre numéro
            de réservation #{confirmationCode}.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bus" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Récapitulatif du trajet</Text>
          </View>

          <Text style={styles.tripCompany}>
            {tripInfo.company || "Compagnie"} · {ticketCount || 1} {ticketWord}
          </Text>
          <Text style={styles.tripRoute}>
            {routeStations ||
              [tripInfo.departureCity, tripInfo.arrivalCity]
                .filter(Boolean)
                .join(" ➔ ") ||
              "Trajet"}
          </Text>

          {longDate ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={16}
                color="#606060"
              />
              <Text style={styles.metaText}>{longDate}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color="#606060"
            />
            <Text style={styles.metaText}>
              Départ à {tripInfo.departureTimeStr || "—"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="cash"
              size={16}
              color="#606060"
            />
            <Text style={styles.metaText}>Montant réglé : {paidAmount}</Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={goToTrips}
          accessibilityRole="button"
          accessibilityLabel="Aller à Mes Voyages"
        >
          <MaterialCommunityIcons name="ticket-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Aller à « Mes Voyages »</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Retourner à l'accueil"
        >
          <Ionicons name="home-outline" size={18} color="#111111" />
          <Text style={styles.secondaryBtnText}>Retourner à l&apos;accueil</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F8" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "TTNormsPro-Bold",
    color: "#111111",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  hero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E3E7",
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF1F0",
    borderWidth: 1,
    borderColor: "#FFD4CF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  codeChip: {
    alignItems: "center",
    backgroundColor: "#F7F7F8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E3E7",
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: "80%",
  },
  codeLabel: {
    fontSize: 11,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 28,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    letterSpacing: 2,
  },
  codeBrand: {
    marginTop: 4,
    fontSize: 12,
    color: colors.primary,
    fontFamily: "TTNormsPro-Bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E3E7",
    padding: 16,
    marginBottom: 12,
  },
  guichetCard: {
    backgroundColor: "#F1F5EB",
    borderColor: "#DCE8C8",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  stepText: {
    fontSize: 14,
    color: "#404040",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 21,
    marginBottom: 6,
  },
  guichetBody: {
    fontSize: 14,
    color: "#3F5A1E",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 21,
  },
  tripCompany: {
    fontSize: 16,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    marginBottom: 6,
  },
  tripRoute: {
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 14,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  primaryBtn: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "TTNormsPro-Bold",
  },
  secondaryBtn: {
    marginTop: 10,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7D8DB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: "#111111",
    fontSize: 15,
    fontFamily: "TTNormsPro-Bold",
  },
});

export default OrderConfirmation;
