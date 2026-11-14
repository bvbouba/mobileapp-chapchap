import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors } from "../Themed";
import {
  getPaymentMethodMeta,
  paymentMethodToComponent,
  paystackPreferred,
} from "./payments/supportedPaymentApps";
import { usePayments } from "./payments/usePayments";
import { EllipsisLoader } from "../EllipsisLoader";
import { paystackGatewayId } from "./payments/paystack/types";

function formatTotalDisplay(raw: string): string {
  // Accept "10500 XOF" / "10 500 FCFA" / plain number-ish strings
  const match = raw.replace(/\s/g, "").match(/([\d.,]+)\s*([A-Za-z]*)/);
  if (!match) return raw;
  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount)) return raw;
  const curRaw = (match[2] || "XOF").toUpperCase();
  const cur = curRaw === "XOF" || curRaw === "" ? "FCFA" : curRaw;
  return `${Math.round(amount).toLocaleString("fr-FR")} ${cur}`;
}

export const PaymentModal = ({
  visible,
  onClose,
  totalAmount,
  discountHint,
}: {
  visible: boolean;
  onClose: () => void;
  totalAmount: string;
  /** Optional line like "Avoir de 5 000 FCFA déjà appliqué ✓" */
  discountHint?: string | null;
}) => {
  const insets = useSafeAreaInsets();
  const { availablePaymentGateways, fetching } = usePayments();
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(
    null,
  );

  const supportedGateways = useMemo(
    () =>
      availablePaymentGateways.filter((g) => g.id in paymentMethodToComponent),
    [availablePaymentGateways],
  );

  // Streamlined: jump straight into Paystack Mobile Money when available.
  useEffect(() => {
    if (!visible) {
      setSelectedGatewayId(null);
      return;
    }
    if (fetching || supportedGateways.length === 0) return;

    const paystack = supportedGateways.find(
      (g) =>
        g.id === paystackGatewayId ||
        g.id.includes("paystack") ||
        paystackPreferred(g.id),
    );
    if (paystack) {
      setSelectedGatewayId(paystack.id);
      return;
    }
    if (supportedGateways.length === 1) {
      setSelectedGatewayId(supportedGateways[0].id);
    }
  }, [visible, fetching, supportedGateways]);

  const handleClose = () => {
    setSelectedGatewayId(null);
    onClose();
  };

  const handleBack = () => {
    if (supportedGateways.length > 1 && selectedGatewayId) {
      // Only show gateway list again if there are alternatives.
      const onlyPaystack =
        supportedGateways.length === 1 ||
        (supportedGateways.length > 0 &&
          supportedGateways.every(
            (g) => g.id.includes("paystack") || g.id === paystackGatewayId,
          ));
      if (onlyPaystack) {
        handleClose();
        return;
      }
      setSelectedGatewayId(null);
      return;
    }
    handleClose();
  };

  const displayTotal = formatTotalDisplay(totalAmount);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerIconBtn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons name="arrow-back" size={22} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement sécurisé</Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.headerIconBtn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sectionShell}>
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Total à régler</Text>
              <Text style={styles.amountValue}>{displayTotal}</Text>
              {discountHint ? (
                <Text style={styles.discountHint}>{discountHint}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.sectionShell}>
            <View style={styles.paymentSection}>
              {fetching ? (
                <View style={styles.loadingContainer}>
                  <EllipsisLoader color="#EB1700" />
                </View>
              ) : selectedGatewayId ? (
                <View style={styles.selectedContainer}>
                  {(() => {
                    const Component =
                      paymentMethodToComponent[selectedGatewayId];
                    const gateway = availablePaymentGateways.find(
                      (g) => g.id === selectedGatewayId,
                    );
                    if (!Component) {
                      return (
                        <Text style={styles.confirmTitle}>
                          Mode de paiement indisponible.
                        </Text>
                      );
                    }
                    return <Component config={gateway} />;
                  })()}
                </View>
              ) : (
                <View style={styles.gatewaysList}>
                  <Text style={styles.subTitle}>Choisissez un mode</Text>
                  {supportedGateways.map((gateway) => {
                    const meta = getPaymentMethodMeta(gateway.id);
                    return (
                      <TouchableOpacity
                        key={gateway.id}
                        style={styles.methodItem}
                        onPress={() => setSelectedGatewayId(gateway.id)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.methodIconBox}>
                          <Image
                            source={meta.logo}
                            style={styles.methodLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.methodName}>{meta.label}</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#D7D8DB"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1F1F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#D7D8DB",
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
  },
  scroll: { flex: 1, backgroundColor: "#F1F1F1" },
  scrollContent: { paddingTop: 12 },
  sectionShell: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    overflow: "hidden",
  },
  amountSection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  amountLabel: {
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  amountValue: {
    fontSize: 28,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    marginTop: 6,
  },
  discountHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.green,
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
  },
  paymentSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  subTitle: {
    fontSize: 12,
    color: "#606060",
    marginBottom: 12,
    fontFamily: "TTNormsPro-Bold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  gatewaysList: { gap: 10 },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#F1F1F1",
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#D7D8DB",
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7D8DB",
    overflow: "hidden",
  },
  methodLogo: {
    width: 32,
    height: 32,
  },
  methodName: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
  },
  selectedContainer: {},
  confirmTitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#606060",
    marginBottom: 8,
    fontFamily: "TTNormsPro-Regular",
  },
});
