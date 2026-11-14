import { FC } from "react";
import { StyleSheet, Pressable, View, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { OrderFragment } from "../../saleor/api.generated";
import { Text, colors } from "../Themed";
import { getOperatorChannelSlug, getTripInformation } from "../../utils/attribute";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";
import { getConfirmationCode } from "../../utils/generateShortCode";
import { getTripStatusBadge } from "../../lib/tripStatus";
import { getBookingBadge } from "../../lib/bookingStatus";
import { getPassengerDisplayNames } from "../../utils/passengersMetadata";
import {
  resolveProductLogoUrl,
  useOperatorLogo,
} from "../../hooks/useOperatorLogo";

dayjs.locale("fr");

interface Props {
  order: OrderFragment & {
    isPaid?: boolean | null;
    paymentStatusDisplay?: string | null;
  };
}

function formatCardDate(departureDate: Date | null): string {
  if (!departureDate) return "—";
  const raw = dayjs(departureDate).locale("fr").format("dddd D MMMM YYYY");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function periodOfDayLabel(departureDate: Date | null): string {
  if (!departureDate) return "";
  const h = departureDate.getHours();
  if (h < 12) return "Matin";
  if (h < 17) return "Milieu de journée";
  return "Soir";
}

function resolveOrderTotal(order: OrderFragment): { amount: number; currency: string } {
  const currency = order.total?.gross?.currency || "XOF";
  const reported = order.total?.gross?.amount;
  if (typeof reported === "number" && Number.isFinite(reported) && reported > 0) {
    return { amount: reported, currency };
  }
  let sum = 0;
  for (const line of order.lines ?? []) {
    const lineTotal = line.totalPrice?.gross?.amount;
    if (typeof lineTotal === "number" && lineTotal > 0) {
      sum += lineTotal;
      continue;
    }
    const unit = line.undiscountedUnitPrice?.gross?.amount ?? 0;
    if (unit > 0) sum += unit * (line.quantity || 1);
  }
  return { amount: sum, currency };
}

function formatMoney(amount: number, currency: string): string {
  const cur = currency.toUpperCase() === "XOF" ? "FCFA" : currency;
  return `${Math.round(amount).toLocaleString("fr-FR")} ${cur}`;
}

const OrderListItem: FC<Props> = ({ order }) => {
  const router = useRouter();
  const ticketLines = order.lines.filter(
    (line) => line.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
  );
  const ticketLine = ticketLines[0] ?? order.lines[0];

  const attributes = ticketLine?.variant?.attributes || [];
  const {
    company,
    departureCity,
    arrivalCity,
    departureStation,
    arrivalStation,
    departureTimeStr,
    departureDate,
  } = getTripInformation({ attributes });

  const logoUrl = useOperatorLogo({
    productLogoUrl: resolveProductLogoUrl(ticketLine?.variant?.product),
    operatorChannelSlug: getOperatorChannelSlug(attributes),
  });

  const variantMeta = ticketLine?.variant?.metadata ?? [];
  const tripBadge = getTripStatusBadge(variantMeta, {
    orderStatus: order.status,
    orderMetadata: order.metadata,
    fulfillments: order.fulfillments,
  });
  const total = resolveOrderTotal(order);
  const bookingBadge = getBookingBadge({
    orderStatus: order.status,
    isPaid: order.isPaid,
    paymentStatus: order.paymentStatus,
    paymentStatusDisplay: order.paymentStatusDisplay,
    authorizeStatus: order.authorizeStatus,
    chargeStatus: order.chargeStatus,
    metadata: order.metadata,
    fulfillments: order.fulfillments,
    paidAmountLabel: formatMoney(total.amount, total.currency),
  });

  // Booking phase wins until issued/boarded; then trip ops status can show.
  const statusCfg =
    bookingBadge.phase === "issued" || bookingBadge.phase === "boarded"
      ? bookingBadge.phase === "boarded"
        ? bookingBadge
        : tripBadge.label === "Programmé" || tripBadge.label === "Confirmé"
          ? bookingBadge
          : {
              label: tripBadge.label,
              color: tripBadge.color,
              bg: tripBadge.bg,
              border: tripBadge.border,
            }
      : bookingBadge;

  const confirmationCode = getConfirmationCode(order);
  const passengers = getPassengerDisplayNames({
    metadata: order.metadata,
    customerNote: order.customerNote,
  });
  const passengerCount =
    passengers.length || ticketLines.reduce((n, l) => n + (l.quantity || 0), 0) || 1;
  const period = periodOfDayLabel(departureDate);

  const onPress = () =>
    router.push({
      pathname: `/orderDetails/${order.id}`,
    });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`${company || "Transport"}, ${departureCity || ""} vers ${arrivalCity || ""}`}
    >
      <View style={styles.header}>
        <View style={styles.companyRow}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={styles.logoFallback}>
              <MaterialCommunityIcons
                name="bus"
                size={16}
                color={colors.green}
              />
            </View>
          )}
          <View style={styles.companyTextWrap}>
            <Text style={styles.companyText} numberOfLines={1}>
              {company || "Transport"}
            </Text>
            <Text style={styles.ticketNo}>N° Billet : #{order.number || "—"}</Text>
          </View>
        </View>
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

      <View style={styles.routeBlock}>
        <View style={styles.cityCol}>
          <Text style={styles.cityText} numberOfLines={1}>
            {departureCity || "Départ"}
          </Text>
          {departureStation ? (
            <Text style={styles.stationText} numberOfLines={2}>
              {departureStation}
            </Text>
          ) : null}
        </View>
        <View style={styles.arrowCol}>
          <View style={styles.arrowLine} />
          <MaterialCommunityIcons name="arrow-right" size={16} color="#A0A0A0" />
        </View>
        <View style={[styles.cityCol, styles.cityColRight]}>
          <Text style={[styles.cityText, styles.textRight]} numberOfLines={1}>
            {arrivalCity || "Arrivée"}
          </Text>
          {arrivalStation ? (
            <Text style={[styles.stationText, styles.textRight]} numberOfLines={2}>
              {arrivalStation}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar" size={15} color="#606060" />
          <Text style={styles.metaText}>{formatCardDate(departureDate)}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={15} color="#606060" />
          <Text style={styles.metaText}>
            {departureTimeStr}
            {period ? <Text style={styles.metaMuted}> ({period})</Text> : null}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account-group-outline" size={15} color="#606060" />
          <Text style={styles.metaText}>
            {passengerCount} passager{passengerCount > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="cash" size={15} color="#606060" />
          <Text style={[styles.metaText, styles.metaBold]}>
            {formatMoney(total.amount, total.currency)}
            {bookingBadge.phase === "issued" ||
            bookingBadge.phase === "boarded" ||
            bookingBadge.phase === "awaiting_guichet" ? (
              <Text style={styles.metaMuted}> · Payé</Text>
            ) : null}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.refText}>Code : {confirmationCode}</Text>
        <View style={styles.ctaChip}>
          <MaterialCommunityIcons name="qrcode" size={14} color="#FFFFFF" />
          <Text style={styles.ctaChipText}>
            {bookingBadge.phase === "issued" || bookingBadge.phase === "boarded"
              ? "Voir le billet"
              : "Voir le détail"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default OrderListItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E3E7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  companyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 4,
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
  companyTextWrap: { flex: 1, minWidth: 0 },
  companyText: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: "#111111",
    textTransform: "uppercase",
  },
  ticketNo: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "42%",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
  },
  routeBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cityCol: { flex: 1, minWidth: 0 },
  cityColRight: { alignItems: "flex-end" },
  cityText: {
    fontSize: 17,
    fontFamily: "TTNormsPro-Bold",
    color: "#111111",
  },
  stationText: {
    marginTop: 3,
    fontSize: 12,
    fontFamily: "TTNormsPro-Regular",
    color: "#606060",
    lineHeight: 16,
  },
  textRight: { textAlign: "right" },
  arrowCol: {
    width: 36,
    alignItems: "center",
    paddingTop: 4,
  },
  arrowLine: {
    position: "absolute",
    top: 12,
    width: 28,
    height: 1,
    backgroundColor: "#D7D8DB",
  },
  metaGrid: { gap: 8 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: "#303030",
  },
  metaBold: { fontFamily: "TTNormsPro-Bold", color: "#111111" },
  metaMuted: {
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEF0",
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  refText: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
  },
  ctaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.red,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaChipText: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: "#FFFFFF",
  },
});
