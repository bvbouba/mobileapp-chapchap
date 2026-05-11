import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Divider, PaddedView } from "../Themed";
import { getTripInformation } from "../../utils/attribute";
import { EllipsisLoader } from "../EllipsisLoader";

const LINK_GREY = "#D7D8DB";
const DOT_GREY = "#B0B0B0";

interface SummaryProps {
  lines: any[];
  totalPrice?: {
    gross: { currency: string; amount: number };
  };
  editable?: boolean;
  voucherCode?: string | null;
  giftCards?: any[];
  shippingPrice?: any;
  /** When false, service fee + total rows stay hidden until checkout pricing includes the platform fee. */
  pricingReady?: boolean;
}

export const Summary: React.FC<SummaryProps> = ({
  lines,
  totalPrice,
  pricingReady = true,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const feeLine = lines?.find((line) => line?.variant?.product?.slug === "platform-fee");
  const tripLines = lines?.filter((line) => line?.variant?.product?.slug !== "platform-fee");
  const line = tripLines?.[0];
  const {
    departureCity,
    departureTimeStr,
    arrivalCity,
    arrivalTimeStr,
    formattedDate,
    departureStation,
    arrivalStation,
  } = getTripInformation({ attributes: line?.variant?.attributes || [] });

  const passengerCount = tripLines.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const amount = totalPrice?.gross?.amount ?? 0;
  const currency = totalPrice?.gross?.currency ?? "XOF";
  const platformFeeAmount = feeLine?.totalPrice?.gross?.amount ?? 0;
  const platformFeeCurrency = feeLine?.totalPrice?.gross?.currency ?? currency;
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.85}
      >
        <Text style={styles.title}>Résumé du voyage</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#606060"
        />
      </TouchableOpacity>

      {isOpen && (
        <PaddedView style={styles.content}>
          <View style={styles.routeRow}>
            <View style={styles.routeRail}>
              <View style={styles.dot} />
              <View style={styles.segmentLine} />
              <View style={styles.dot} />
            </View>

            <View style={styles.routeBody}>
              <View style={styles.routeStop}>
                <Text style={styles.cityLabel}>Départ: {departureCity?.toUpperCase()}</Text>
                <Text style={styles.timeLabel}>
                  {departureTimeStr} • {formattedDate}
                </Text>
                <Text style={styles.stationLabel}>{departureStation}</Text>
              </View>

              <View style={styles.routeStop}>
                <Text style={styles.cityLabel}>Arrivée: {arrivalCity?.toUpperCase()}</Text>
                <Text style={styles.timeLabel}>
                  {arrivalTimeStr} • {formattedDate}
                </Text>
                <Text style={styles.stationLabel}>{arrivalStation}</Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.serviceFeeLabelWrap}>
              <Text style={styles.label}>Service Fee</Text>
              <TouchableOpacity
                style={styles.infoIconBtn}
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert(
                    "Service Fee",
                    "This fee helps us keep the Sira platform secure and provides you with 24/7 customer support for your journey."
                  )
                }
              >
                <Ionicons name="information-circle-outline" size={16} color="#606060" />
              </TouchableOpacity>
            </View>
            <Text style={styles.value}>
              {platformFeeAmount} {platformFeeCurrency}
            </Text>
          </View>

          <View style={[styles.row, { marginTop: 10 }]}>
            <View>
              <Text style={styles.totalLabel}>Total du voyage</Text>
              <Text style={styles.passengerSub}>Pour {passengerCount} voyageur(s)</Text>
            </View>
            <Text style={styles.totalValue}>
              {amount} {currency}
            </Text>
          </View>
        </PaddedView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
  },
  content: {
    paddingTop: 0,
    paddingBottom: 20,
  },
  routeRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  routeRail: {
    width: 10,
    alignItems: "center",
    paddingTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DOT_GREY,
  },
  segmentLine: {
    width: 2,
    flexGrow: 1,
    minHeight: 28,
    marginVertical: 4,
    backgroundColor: LINK_GREY,
    borderRadius: 1,
  },
  routeBody: {
    flex: 1,
    justifyContent: "space-between",
    gap: 16,
  },
  routeStop: {
    flexShrink: 0,
  },
  cityLabel: {
    fontSize: 14,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
  },
  timeLabel: {
    fontSize: 13,
    color: "#606060",
    marginVertical: 2,
    fontFamily: "TTNormsPro-Regular",
  },
  stationLabel: {
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  divider: { marginVertical: 16, backgroundColor: "#F1F1F1" },
  pricingPending: {
    minHeight: 72,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  pricingPendingText: {
    fontSize: 13,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceFeeLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoIconBtn: {
    padding: 2,
  },
  label: { fontSize: 14, color: "#606060", fontFamily: "TTNormsPro-Regular" },
  value: { fontSize: 14, color: "#000000", fontFamily: "TTNormsPro-Regular" },
  totalLabel: {
    fontSize: 16,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
  },
  passengerSub: { fontSize: 12, color: "#606060", fontFamily: "TTNormsPro-Regular" },
  totalValue: {
    fontSize: 20,
    color: "#02838A",
    fontFamily: "TTNormsPro-Bold",
  },
});
