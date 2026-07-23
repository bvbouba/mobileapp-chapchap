import { Stack, usePathname, useRouter } from "expo-router";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
  StatusBar,
  RefreshControl,
} from "react-native";
import { Text, colors } from "../../components/Themed";
import { useOrderContext } from "../../context/useOrderContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OrderFragment, useGetOrderByIdLazyQuery } from "../../saleor/api.generated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TicketModalContent } from "../../components/orders/TicketModalContent";
import { getTripInformation } from "../../utils/attribute";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";
import { getConfirmationCode } from "../../utils/generateShortCode";
import { getTripStatusBadge } from "../../lib/tripStatus";
import { formatTripNumberLabel } from "../../utils/tripNumber";

type OrderWithPayment = OrderFragment & {
  isPaid?: boolean | null;
  paymentStatusDisplay?: string | null;
};

function metaValue(
  metadata: Array<{ key: string; value: string }> | null | undefined,
  key: string,
): string {
  const want = key.toLowerCase();
  for (const m of metadata ?? []) {
    if ((m.key ?? "").toLowerCase() === want) return (m.value ?? "").trim();
  }
  return "";
}

function formatPassengerName(block: string): string {
  const [lastName, firstName] = block.split(",");
  if (firstName?.trim() && lastName?.trim()) {
    return `${firstName.trim()} ${lastName.trim()}`;
  }
  return block.trim() || "Passager";
}

function formatMoney(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount);
  const cur = (currency || "").toUpperCase();
  if (cur === "XOF" || cur === "CFA" || cur === "FCFA") return `${formatted} FCFA`;
  return `${formatted} ${currency}`;
}

function paymentMethodLabel(metadata: Array<{ key: string; value: string }>): string {
  const raw = metaValue(metadata, "payment_method").toLowerCase();
  if (!raw) return "";
  if (raw.includes("wave")) return "Wave";
  if (raw.includes("orange") || raw === "om") return "Orange Money";
  if (raw.includes("mtn") || raw.includes("momo")) return "MTN MoMo";
  if (raw.includes("moov")) return "Moov Money";
  if (raw.includes("mobile") || raw.includes("momo") || raw === "mobile_money") {
    return "Mobile Money";
  }
  if (raw === "cash" || raw.includes("espec") || raw.includes("espèces")) {
    return "Espèces (guichet)";
  }
  if (raw.includes("card") || raw.includes("carte") || raw.includes("stripe")) {
    return "Carte bancaire";
  }
  if (raw.includes("paystack")) return "Paystack";
  if (raw.includes("transfer")) return "Transfert";
  return raw.replace(/_/g, " ");
}

function paymentStatusLine(order: OrderWithPayment): string {
  const method = paymentMethodLabel(order.metadata);
  const paid =
    order.isPaid === true ||
    (order.paymentStatusDisplay ?? "").toLowerCase().includes("fully") ||
    (order.paymentStatusDisplay ?? "").toLowerCase().includes("paid") ||
    (order.status ?? "").toUpperCase() === "FULFILLED";

  const statusLabel = paid
    ? "Payé"
    : order.paymentStatusDisplay?.trim() || "En attente";

  return method ? `${statusLabel} (${method})` : statusLabel;
}

const OrderDetailsPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [orderCache, setOrderCache] = useState<OrderWithPayment | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const { orders } = useOrderContext();
  const [getOrderById] = useGetOrderByIdLazyQuery();

  const orderId = pathname.split("/").pop();

  useEffect(() => {
    const order = orders.find((o) => o.id === orderId) as OrderWithPayment | undefined;
    setOrderCache(order);
    setLoading(false);
  }, [orderId, orders]);

  const onRefresh = useCallback(async () => {
    if (!orderId) return;
    setRefreshing(true);
    try {
      const res = await getOrderById({
        variables: { id: orderId },
        fetchPolicy: "network-only",
      });
      const fresh = res.data?.order as OrderWithPayment | undefined;
      if (fresh) setOrderCache(fresh);
    } finally {
      setRefreshing(false);
    }
  }, [getOrderById, orderId]);

  const trip = useMemo(() => {
    if (!orderCache) return null;
    const ticketLine =
      orderCache.lines.find(
        (line) => line.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
      ) ?? orderCache.lines[0];
    const attrs = ticketLine?.variant?.attributes || [];
    const info = getTripInformation({ attributes: attrs });
    const statusCfg = getTripStatusBadge(ticketLine?.variant?.metadata ?? []);
    return { ticketLine, info, statusCfg };
  }, [orderCache]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Chargement...</Text>
      </View>
    );
  }
  if (!orderCache || !trip) {
    return (
      <View style={styles.centered}>
        <Text>Commande introuvable</Text>
      </View>
    );
  }

  const { info, statusCfg, ticketLine } = trip;
  const confirmationCode = getConfirmationCode(orderCache);
  const tripIdLabel = ticketLine?.variant?.id
    ? formatTripNumberLabel(ticketLine.variant.id)
    : null;
  const ticketCount = orderCache.lines
    .filter((line) => line.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG)
    .reduce((sum, line) => sum + line.quantity, 0);
  const namedPassengers = (orderCache.customerNote || "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map(formatPassengerName);
  const passengers =
    namedPassengers.length > 0
      ? namedPassengers
      : Array.from({ length: Math.max(ticketCount, 1) }, (_, i) =>
          ticketCount > 1 ? `Passager ${i + 1}` : "Passager",
        );

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F1F1" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F1F1" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topHeader, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.green} />
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Détails du voyage</Text>
          <Text style={styles.headerSubtitle}>Réservation et billet</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 32 + Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.green}
            colors={[colors.green]}
          />
        }
      >
        {/* Header: operator + status + ref */}
        <View style={styles.card}>
          <View style={styles.heroHeader}>
            <Text style={styles.companyName} numberOfLines={1}>
              {info.company || "Transport"}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
              ]}
            >
              <Text style={[styles.statusText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
          <View style={styles.refRow}>
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={16}
              color="#606060"
            />
            <Text style={styles.refText}>Ref: {confirmationCode}</Text>
          </View>
          {tripIdLabel ? (
            <View style={styles.refRow}>
              <MaterialCommunityIcons name="bus" size={16} color="#606060" />
              <Text style={styles.refText}>Trajet: {tripIdLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* Primary CTA */}
        <Pressable
          style={({ pressed }) => [styles.ticketButton, pressed && { opacity: 0.92 }]}
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Afficher mon billet ou QR code"
        >
          <MaterialCommunityIcons name="cellphone" size={22} color="#FFFFFF" />
          <Text style={styles.ticketButtonText}>Afficher mon billet / QR code</Text>
        </Pressable>

        {/* Itinerary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Itinéraire</Text>

          <View style={styles.stopBlock}>
            <View style={styles.stopHeadline}>
              <View style={[styles.dot, styles.dotDep]} />
              <Text style={styles.stopTimeCity}>
                {info.departureTimeStr}
                {info.departureCity ? ` • ${info.departureCity}` : ""}
              </Text>
            </View>
            {info.departureStation ? (
              <View style={styles.stationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color="#606060" />
                <Text style={styles.stationText}>{info.departureStation}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.durationRail}>
            <View style={styles.railLine} />
            <View style={styles.durationPill}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#606060" />
              <Text style={styles.durationText}>
                Durée approx: {info.readableDuration || "—"}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#A0A0A0" />
          </View>

          <View style={styles.stopBlock}>
            <View style={styles.stopHeadline}>
              <View style={[styles.dot, styles.dotArr]} />
              <Text style={styles.stopTimeCity}>
                {info.arrivalTimeStr || "—"}
                {info.arrivalCity ? ` • ${info.arrivalCity}` : ""}
              </Text>
            </View>
            {info.arrivalStation ? (
              <View style={styles.stationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color="#606060" />
                <Text style={styles.stationText}>{info.arrivalStation}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Passengers */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Informations passager{passengers.length > 1 ? "s" : ""} ({passengers.length})
          </Text>
          {passengers.map((name, i) => (
            <View
              key={`${name}-${i}`}
              style={[
                styles.passengerRow,
                i < passengers.length - 1 && styles.passengerRowSpaced,
              ]}
            >
              <MaterialCommunityIcons name="account-outline" size={18} color="#606060" />
              <Text style={styles.passengerLabel}>
                {passengers.length > 1 ? `Nom ${i + 1}:` : "Nom:"}
              </Text>
              <Text style={styles.passengerName}>{name}</Text>
            </View>
          ))}
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Paiement</Text>
          <View style={styles.paymentRow}>
            <MaterialCommunityIcons name="credit-card-outline" size={18} color="#606060" />
            <Text style={styles.paymentLabel}>Statut:</Text>
            <Text style={styles.paymentValue}>{paymentStatusLine(orderCache)}</Text>
          </View>
          <View style={[styles.paymentRow, { marginTop: 10 }]}>
            <MaterialCommunityIcons name="cash" size={18} color="#606060" />
            <Text style={styles.paymentLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {formatMoney(orderCache.total.gross.amount, orderCache.total.gross.currency)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={28} color="#000000" />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.modalScroll,
              { paddingBottom: 40 + Math.max(insets.bottom, 20) },
            ]}
          >
            <TicketModalContent order={orderCache} />
            <Text style={styles.modalFooterText}>Présentez le QR code au contrôle</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topHeader: {
    backgroundColor: "#F1F1F1",
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D7D8DB",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D7D8DB",
    marginRight: 12,
  },
  headerTextBlock: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
    marginTop: 2,
  },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D7D8DB",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  companyName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "45%",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  refText: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
  },
  ticketButton: {
    backgroundColor: colors.red,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  ticketButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  stopBlock: { marginBottom: 4 },
  stopHeadline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotDep: { backgroundColor: "#22C55E" },
  dotArr: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#EB1700",
  },
  stopTimeCity: {
    flex: 1,
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
  },
  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    marginLeft: 22,
  },
  stationText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
  },
  durationRail: {
    marginLeft: 5,
    marginVertical: 10,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#D7D8DB",
    gap: 6,
  },
  railLine: { height: 0 },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  durationText: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passengerRowSpaced: {
    marginBottom: 12,
  },
  passengerLabel: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
  },
  passengerName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
  },
  paymentValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
  },
  totalValue: {
    flex: 1,
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: colors.green,
  },
  modalContainer: { flex: 1, backgroundColor: colors.green },
  modalHeader: { paddingHorizontal: 20, alignItems: "flex-end" },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: { paddingBottom: 40, alignItems: "center" },
  modalFooterText: {
    color: "rgba(0,0,0,0.55)",
    textAlign: "center",
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
  },
});

export default OrderDetailsPage;
