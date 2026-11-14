import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { getConfirmationCode } from "../../utils/generateShortCode";
import { formatTripNumberLabel } from "../../utils/tripNumber";
import { parseCompanyTicketNumbers } from "../../utils/companyTicketNumbers";
import { OrderFragment } from "../../saleor/api.generated";
import { getTripInformation } from "../../utils/attribute";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { colors } from "../Themed";
import { getTripStatusBadge } from "../../lib/tripStatus";
import { formatPaymentStatusLabelFr } from "../../lib/bookingStatus";
import { getPassengerDisplayNames } from "../../utils/passengersMetadata";

dayjs.locale("fr");

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TICKET_PROOF_IMAGE_URL_KEY = "ticket_proof_image_url";
type OrderMetadataItem = { key: string; value: string };
type ZoomTarget = "image" | "qr" | null;

type OrderWithPayment = OrderFragment & {
  isPaid?: boolean | null;
  paymentStatus?: string | null;
  paymentStatusDisplay?: string | null;
  authorizeStatus?: string | null;
  chargeStatus?: string | null;
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

function formatLongFrenchDate(date: Date | null): string {
  if (!date) return "—";
  const raw = dayjs(date).locale("fr").format("dddd, D MMMM YYYY");
  return raw
    .split(" ")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
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
  if (raw.includes("mobile") || raw === "mobile_money") return "Mobile Money";
  if (raw === "cash" || raw.includes("espec")) return "Espèces (guichet)";
  if (raw.includes("card") || raw.includes("carte") || raw.includes("stripe")) {
    return "Carte bancaire";
  }
  if (raw.includes("paystack")) return "Paystack";
  if (raw.includes("transfer")) return "Transfert";
  return raw.replace(/_/g, " ");
}

function paymentStatusLine(order: OrderWithPayment): string {
  const method = paymentMethodLabel(order.metadata ?? []);
  const statusLabel = formatPaymentStatusLabelFr({
    isPaid: order.isPaid,
    paymentStatus: order.paymentStatus,
    paymentStatusDisplay: order.paymentStatusDisplay,
    authorizeStatus: order.authorizeStatus,
    chargeStatus: order.chargeStatus,
    metadata: order.metadata,
  });
  return method ? `${statusLabel} (${method})` : statusLabel;
}

export const TicketModalContent = ({ order }: { order: OrderFragment }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [zoomTarget, setZoomTarget] = useState<ZoomTarget>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const ticketLines = order.lines.filter(
    (line) => line.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
  );
  const ticketLine = ticketLines[0] ?? order.lines[0];
  const ticketCount = ticketLines.reduce((sum, line) => sum + line.quantity, 0);
  const attributes = ticketLine?.variant?.attributes || [];
  const {
    departureCity,
    arrivalCity,
    departureTimeStr,
    arrivalTimeStr,
    company,
    departureDate,
  } = getTripInformation({ attributes });

  const statusCfg = getTripStatusBadge(
    (ticketLine?.variant as { metadata?: Array<{ key: string; value: string }> } | null | undefined)
      ?.metadata ?? [],
    {
      orderStatus: order.status,
      orderMetadata: order.metadata,
      fulfillments: order.fulfillments,
    },
  );
  const confirmationCode = getConfirmationCode(order);
  const tripIdLabel = ticketLine?.variant?.id
    ? formatTripNumberLabel(ticketLine.variant.id)
    : null;
  const orderMetadata =
    (order as OrderFragment & { metadata?: OrderMetadataItem[] }).metadata ?? [];
  const rawTicketImageUrl = orderMetadata.find(
    (item) => item.key === TICKET_PROOF_IMAGE_URL_KEY,
  )?.value;
  const ticketImageUrl = resolveMediaUrl(rawTicketImageUrl);
  const companyTicketNumbers = parseCompanyTicketNumbers(orderMetadata);

  const getPassengers = (): string[] => {
    const names = getPassengerDisplayNames({
      metadata: order.metadata,
      customerNote: order.customerNote,
    });
    if (names.length > 0) return names;
    return Array.from({ length: Math.max(ticketCount, 1) }, (_, i) =>
      ticketCount > 1 ? `Passager ${i + 1}` : "Passager",
    );
  };

  const allPassengers = getPassengers();
  const qrPreviewSize = Math.min(width * 0.52, 200);
  const qrZoomSize = Math.min(width * 0.72, height * 0.55);
  const paidLine = paymentStatusLine(order as OrderWithPayment);

  const toggleReceipt = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setReceiptOpen((v) => !v);
  };

  return (
    <View style={[styles.ticketContainer, { width: Math.min(width * 0.9, 520) }]}>
      {/* Brand + status + operator */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
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
        <View style={styles.operatorRow}>
          <MaterialCommunityIcons name="office-building-outline" size={15} color="#606060" />
          <Text style={styles.companyName} numberOfLines={1}>
            {company || "Transport"}
          </Text>
        </View>
      </View>

      <View style={styles.dashedLine} />

      {/* QR first */}
      <View style={styles.qrSection}>
        <Pressable
          onPress={() => setZoomTarget("qr")}
          style={styles.qrFrame}
          accessibilityRole="button"
          accessibilityLabel="Agrandir le code QR"
        >
          <QRCode
            value={order.id}
            size={qrPreviewSize}
            color="#111827"
            backgroundColor="white"
          />
          <Text style={styles.scanHere}>Scan here</Text>
        </Pressable>
        <Text style={styles.codeLabel}>
          Code: <Text style={styles.codeValue}>{confirmationCode}</Text>
        </Text>
        {tripIdLabel ? (
          <Text style={styles.tripIdLabel}>
            Trajet: <Text style={styles.codeValue}>{tripIdLabel}</Text>
          </Text>
        ) : null}
      </View>

      <View style={styles.dashedLine} />

      {/* Trip summary */}
      <View style={styles.bodySection}>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#606060" />
          <Text style={styles.dateText}>Date : {formatLongFrenchDate(departureDate)}</Text>
        </View>
        <View style={[styles.dateRow, { marginTop: 6 }]}>
          <MaterialCommunityIcons name="calendar-check-outline" size={16} color="#606060" />
          <Text style={styles.dateText}>
            Acheté le : {formatLongFrenchDate(order.created ? new Date(order.created) : null)}
          </Text>
        </View>

        <View style={styles.depArrRow}>
          <View style={styles.depArrCol}>
            <Text style={styles.depArrLabel}>Départ</Text>
            <View style={styles.timeRow}>
              <MaterialCommunityIcons name="clock-outline" size={15} color="#606060" />
              <Text style={styles.timeText}>{departureTimeStr}</Text>
            </View>
            <View style={styles.cityRow}>
              <MaterialCommunityIcons name="city" size={15} color="#606060" />
              <Text style={styles.cityText}>{departureCity || "—"}</Text>
            </View>
          </View>
          <View style={[styles.depArrCol, styles.depArrColRight]}>
            <Text style={styles.depArrLabel}>Arrivée</Text>
            <View style={styles.timeRow}>
              <MaterialCommunityIcons name="clock-outline" size={15} color="#606060" />
              <Text style={styles.timeText}>{arrivalTimeStr || "—"}</Text>
            </View>
            <View style={styles.cityRow}>
              <MaterialCommunityIcons name="city" size={15} color="#606060" />
              <Text style={styles.cityText}>{arrivalCity || "—"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.seatsRow}>
          <MaterialCommunityIcons name="account-group-outline" size={16} color="#606060" />
          <Text style={styles.seatsText}>
            Places : {ticketCount} Passager{ticketCount > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.dashedLine} />

      {/* Passengers */}
      <View style={styles.bodySection}>
        <Text style={styles.sectionTitle}>Passagers</Text>
        {allPassengers.map((name, index) => {
          const companyTicketNo = companyTicketNumbers[index]?.trim();
          return (
            <View key={`${name}-${index}`} style={styles.passengerRow}>
              <Text style={styles.passengerBullet}>• {name}</Text>
              {companyTicketNo ? (
                <Text style={styles.passengerTicketNo}>N° ticket : {companyTicketNo}</Text>
              ) : null}
            </View>
          );
        })}
        {companyTicketNumbers.length > allPassengers.length
          ? companyTicketNumbers.slice(allPassengers.length).map((ticketNo, index) => (
              <Text
                key={`extra-ticket-${index}`}
                style={styles.passengerTicketNo}
              >
                N° ticket : {ticketNo}
              </Text>
            ))
          : null}
      </View>

      <View style={styles.dashedLine} />

      {/* Payment */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Paiement</Text>
        <View style={styles.paymentRow}>
          <View style={styles.paymentStatusWrap}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
            <Text style={styles.paymentStatusText}>{paidLine}</Text>
          </View>
          <Text style={styles.totalText}>
            Total : {formatMoney(order.total.gross.amount, order.total.gross.currency)}
          </Text>
        </View>
      </View>

      <View style={styles.dashedLine} />

      {/* Collapsible physical receipt */}
      <View style={styles.receiptSection}>
        <Pressable
          onPress={toggleReceipt}
          style={styles.receiptToggle}
          accessibilityRole="button"
          accessibilityLabel="Voir le reçu physique ou photo du billet"
        >
          <MaterialCommunityIcons name="camera-outline" size={18} color="#000000" />
          <Text style={styles.receiptToggleText}>
            Voir le reçu physique / photo du billet
          </Text>
          <MaterialCommunityIcons
            name={receiptOpen ? "chevron-up" : "chevron-down"}
            size={22}
            color="#606060"
          />
        </Pressable>

        {receiptOpen ? (
          <>
            {companyTicketNumbers.length > 0 ? (
              <View style={styles.receiptTicketNos}>
                {companyTicketNumbers.map((ticketNo, index) => (
                  <Text key={`receipt-ticket-${index}`} style={styles.receiptTicketNo}>
                    {companyTicketNumbers.length > 1
                      ? `N° ticket ${index + 1} : ${ticketNo}`
                      : `N° ticket compagnie : ${ticketNo}`}
                  </Text>
                ))}
              </View>
            ) : null}
            {ticketImageUrl ? (
              <Pressable
                onPress={() => setZoomTarget("image")}
                style={styles.ticketProofPressable}
                accessibilityRole="button"
                accessibilityLabel="Agrandir la photo du billet"
              >
                <Image
                  source={{ uri: ticketImageUrl }}
                  style={styles.ticketProofImage}
                  resizeMode="contain"
                />
                <View style={styles.zoomHint}>
                  <MaterialCommunityIcons name="magnify-plus-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.zoomHintText}>Appuyer pour agrandir</Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.ticketProofPlaceholder}>
                <MaterialCommunityIcons name="image-outline" size={32} color={colors.green} />
                <Text style={styles.ticketProofPlaceholderText}>
                  La photo du billet sera disponible après la validation par la compagnie.
                </Text>
              </View>
            )}
          </>
        ) : null}
      </View>

      <Modal
        visible={zoomTarget !== null}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => setZoomTarget(null)}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.zoomScreen}>
          <Pressable
            onPress={() => setZoomTarget(null)}
            style={[styles.zoomCloseBtn, { top: insets.top + 12 }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>

          <Pressable style={styles.zoomBody} onPress={() => setZoomTarget(null)}>
            {zoomTarget === "image" && ticketImageUrl ? (
              <Image
                source={{ uri: ticketImageUrl }}
                style={[styles.zoomImage, { width, height: height * 0.85 }]}
                resizeMode="contain"
              />
            ) : null}
            {zoomTarget === "qr" ? (
              <View style={styles.zoomQrWrap}>
                <QRCode
                  value={order.id}
                  size={qrZoomSize}
                  color="#111827"
                  backgroundColor="white"
                />
                <Text style={styles.zoomQrCaption}>Présentez ce code au contrôle</Text>
                <Text style={styles.zoomCode}>{confirmationCode}</Text>
                {tripIdLabel ? <Text style={styles.zoomTripId}>{tripIdLabel}</Text> : null}
              </View>
            ) : null}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  ticketContainer: {
    backgroundColor: "white",
    borderRadius: 24,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    marginVertical: 10,
    overflow: "hidden",
  },  headerSection: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  logo: {
    width: 140,
    height: 45,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "48%",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
  },
  operatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  companyName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dashedLine: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginHorizontal: 15,
  },
  qrSection: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  qrFrame: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    alignItems: "center",
  },
  scanHere: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeLabel: {
    marginTop: 14,
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
  },
  tripIdLabel: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
  },
  codeValue: {
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
    letterSpacing: 2,
  },
  bodySection: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
  },
  depArrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  depArrCol: { flex: 1 },
  depArrColRight: { alignItems: "flex-end" },
  depArrLabel: {
    fontSize: 10,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 20,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cityText: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: "#303030",
  },
  seatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  seatsText: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  passengerBullet: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: "#000000",
    marginBottom: 2,
    textTransform: "capitalize",
  },
  passengerRow: {
    marginBottom: 8,
  },
  passengerTicketNo: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
    marginLeft: 12,
    marginBottom: 2,
  },
  paymentSection: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  paymentStatusWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentStatusText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
  },
  totalText: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Bold",
    color: "#16A34A",
  },
  receiptSection: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  receiptToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  receiptToggleText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  ticketProofPressable: {
    width: "100%",
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D7D8DB",
    backgroundColor: "#F1F1F1",
  },
  ticketProofImage: {
    width: "100%",
    height: 220,
  },
  zoomHint: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  zoomHintText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "TTNormsPro-Bold",
  },
  ticketProofPlaceholder: {
    width: "100%",
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D7D8DB",
    backgroundColor: "#E6F5F3",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    marginTop: 8,
  },
  receiptTicketNos: {
    marginTop: 8,
    marginBottom: 4,
    gap: 4,
  },
  receiptTicketNo: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: "#000000",
  },
  ticketProofPlaceholderText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: colors.green,
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
  },
  zoomScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  zoomCloseBtn: {
    position: "absolute",
    right: 16,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  zoomImage: {
    maxWidth: "100%",
  },
  zoomQrWrap: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  zoomQrCaption: {
    marginTop: 16,
    fontSize: 14,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
    textAlign: "center",
  },
  zoomCode: {
    marginTop: 8,
    fontSize: 20,
    fontFamily: "TTNormsPro-Bold",
    letterSpacing: 3,
    color: "#000000",
  },
  zoomTripId: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
  },
});
