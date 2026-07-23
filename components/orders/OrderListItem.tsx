import { FC } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { OrderFragment } from "../../saleor/api.generated";
import { Text, colors } from "../Themed";
import { getTripInformation } from "../../utils/attribute";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";
import { getConfirmationCode } from "../../utils/generateShortCode";
import { getTripStatusBadge } from "../../lib/tripStatus";

dayjs.locale("fr");

interface Props {
  order: OrderFragment;
}

function formatCardDate(departureDate: Date | null): string {
  if (!departureDate) return "—";
  const raw = dayjs(departureDate).locale("fr").format("ddd D MMM YYYY");
  return raw
    .split(" ")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
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
    departureTimeStr,
    departureDate,
  } = getTripInformation({ attributes });

  const variantMeta = ticketLine?.variant?.metadata ?? [];
  const statusCfg = getTripStatusBadge(variantMeta);
  const confirmationCode = getConfirmationCode(order);

  const routeLabel =
    departureCity && arrivalCity
      ? `${departureCity} ➔ ${arrivalCity}`
      : ticketLine?.variant?.name || "Trajet";

  const onPress = () =>
    router.push({
      pathname: `/orderDetails/${order.id}`,
    });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`${company || "Transport"}, ${routeLabel}, départ ${departureTimeStr}`}
    >
      <View style={styles.header}>
        <View style={styles.companyRow}>
          <MaterialCommunityIcons name="office-building-outline" size={16} color={colors.green} />
          <Text style={styles.companyText} numberOfLines={1}>
            {company || "Transport"}
          </Text>
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

      <View style={styles.routeRow}>
        <MaterialCommunityIcons name="bus" size={18} color={colors.green} />
        <Text style={styles.routeText} numberOfLines={2}>
          {routeLabel}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="calendar" size={15} color="#606060" />
        <Text style={styles.metaText}>{formatCardDate(departureDate)}</Text>
        <Text style={styles.metaDot}>•</Text>
        <MaterialCommunityIcons name="clock-outline" size={15} color="#606060" />
        <Text style={styles.metaText}>
          {departureTimeStr}
          <Text style={styles.metaMuted}> (Départ)</Text>
        </Text>
      </View>

      {departureStation ? (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={15} color="#606060" />
          <Text style={styles.metaText} numberOfLines={1}>
            {departureStation}
          </Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="ticket-confirmation-outline" size={15} color="#606060" />
        <Text style={styles.refText}>Ref : {confirmationCode}</Text>
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D7D8DB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  companyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 4,
  },
  companyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  routeText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: "#303030",
    flexShrink: 1,
  },
  metaMuted: {
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  metaDot: {
    color: "#A0A0A0",
    marginHorizontal: 2,
  },
  refText: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: "#606060",
  },
});
