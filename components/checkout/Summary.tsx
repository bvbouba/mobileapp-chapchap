import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View as RNView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, colors } from "../Themed";
import { getTripInformation } from "../../utils/attribute";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";

interface SummaryProps {
  lines: any[];
  totalPrice?: {
    gross: { currency: string; amount: number };
  };
  editable?: boolean;
  voucherCode?: string | null;
  giftCards?: any[];
  shippingPrice?: any;
  pricingReady?: boolean;
}

function formatMoney(amount?: number | null, currency?: string | null): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const cur =
    (currency || "XOF").toUpperCase() === "XOF" ? "FCFA" : currency || "";
  return `${Math.round(amount).toLocaleString("fr-FR")} ${cur}`.trim();
}

/** Compact accordion trip summary for checkout. */
export const Summary: React.FC<SummaryProps> = ({ lines }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tripLines =
    lines?.filter(
      (line) => line?.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
    ) ?? [];
  const line = tripLines[0];
  const {
    departureCity,
    departureTimeStr,
    arrivalCity,
    arrivalTimeStr,
    formattedDate,
    departureStation,
    arrivalStation,
    company,
  } = getTripInformation({ attributes: line?.variant?.attributes || [] });

  const passengerCount = tripLines.reduce(
    (acc, curr) => acc + (curr.quantity || 0),
    0,
  );
  const ticketWord = passengerCount > 1 ? "tickets" : "ticket";
  const routeLabel = [departureCity, arrivalCity].filter(Boolean).join(" ➔ ");
  const compactTitle = [
    company,
    routeLabel,
    passengerCount ? `(${passengerCount} ${ticketWord})` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <RNView style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Résumé du trajet"
      >
        <RNView style={styles.headerTextWrap}>
          <Text style={styles.eyebrow}>Votre trajet</Text>
          <Text style={styles.compactTitle} numberOfLines={isOpen ? 3 : 2}>
            {compactTitle || "Résumé du voyage"}
          </Text>
          {!isOpen && formattedDate ? (
            <Text style={styles.compactMeta}>{formattedDate}</Text>
          ) : null}
        </RNView>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#606060"
        />
      </TouchableOpacity>

      {isOpen ? (
        <RNView style={styles.content}>
          <RNView style={styles.detailRow}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={16}
              color="#606060"
            />
            <Text style={styles.detailText}>
              {formattedDate || "Date"} · {departureTimeStr}
              {arrivalTimeStr ? ` → ${arrivalTimeStr}` : ""}
            </Text>
          </RNView>
          <RNView style={styles.detailRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={16}
              color="#606060"
            />
            <Text style={styles.detailText}>
              {departureStation || departureCity || "Départ"} →{" "}
              {arrivalStation || arrivalCity || "Arrivée"}
            </Text>
          </RNView>
        </RNView>
      ) : null}
    </RNView>
  );
};

interface FinancialRecapProps {
  lines: any[];
  totalPrice?: {
    gross: { currency: string; amount: number };
  };
  giftCards?: Array<{
    id?: string;
    displayCode?: string;
    currentBalance?: { amount?: number; currency?: string };
  }>;
  voucherCode?: string | null;
}

export const FinancialRecap: React.FC<FinancialRecapProps> = ({
  lines,
  totalPrice,
  giftCards = [],
  voucherCode,
}) => {
  const feeLine = lines?.find(
    (line) => line?.variant?.product?.slug === PLATFORM_FEE_PRODUCT_SLUG,
  );
  const tripLines =
    lines?.filter(
      (line) => line?.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
    ) ?? [];
  const passengerCount = tripLines.reduce(
    (acc, curr) => acc + (curr.quantity || 0),
    0,
  );
  const ticketAmount = tripLines.reduce(
    (acc, l) => acc + (l?.totalPrice?.gross?.amount ?? 0),
    0,
  );
  const currency =
    totalPrice?.gross?.currency ||
    tripLines[0]?.totalPrice?.gross?.currency ||
    "XOF";
  const feeAmount = feeLine?.totalPrice?.gross?.amount ?? 0;
  const totalAmount = totalPrice?.gross?.amount ?? ticketAmount + feeAmount;

  return (
    <RNView style={styles.financeCard}>
      <Text style={styles.financeTitle}>Récapitulatif financier</Text>
      <RNView style={styles.financeRow}>
        <Text style={styles.financeLabel}>
          Billet{passengerCount > 1 ? "s" : ""} x{passengerCount || 1}
        </Text>
        <Text style={styles.financeValue}>
          {formatMoney(ticketAmount, currency)}
        </Text>
      </RNView>
      <RNView style={styles.financeRow}>
        <Text style={styles.financeLabel}>Frais de service</Text>
        <Text style={styles.financeValue}>
          {formatMoney(feeAmount, currency)}
        </Text>
      </RNView>
      {voucherCode ? (
        <RNView style={styles.financeRow}>
          <Text style={styles.financeLabel}>Code promo</Text>
          <Text style={styles.financeCredit}>{voucherCode}</Text>
        </RNView>
      ) : null}
      {giftCards.map((card) => (
        <RNView key={card.id || card.displayCode} style={styles.financeRow}>
          <Text style={styles.financeLabel}>
            Avoir ••••{card.displayCode || ""}
          </Text>
          <Text style={styles.financeCredit}>Appliqué</Text>
        </RNView>
      ))}
      <RNView style={styles.financeDivider} />
      <RNView style={styles.financeRow}>
        <Text style={styles.financeTotalLabel}>Total à régler</Text>
        <Text style={styles.financeTotalValue}>
          {formatMoney(totalAmount, currency)}
        </Text>
      </RNView>
    </RNView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    lineHeight: 20,
  },
  compactMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: "#404040",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 18,
  },
  financeCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  financeTitle: {
    fontSize: 13,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  financeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  financeLabel: {
    fontSize: 14,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  financeValue: {
    fontSize: 14,
    color: "#111111",
    fontFamily: "TTNormsPro-Regular",
  },
  financeCredit: {
    fontSize: 14,
    color: colors.green,
    fontFamily: "TTNormsPro-Bold",
  },
  financeDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E8E9EC",
    marginVertical: 8,
  },
  financeTotalLabel: {
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  financeTotalValue: {
    fontSize: 18,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
});
