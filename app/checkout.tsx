import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isValidPhoneNumber } from "libphonenumber-js";
import { PaymentModal } from "../components/checkout/PaymentModal";
import { PaddedView, Text, View, colors } from "../components/Themed";
import { Summary } from "../components/checkout/Summary";
import { PromoCodeAdd } from "../components/checkout/PromoCodeAdd";
import { ContactSection } from "../components/checkout/ContactSection";
import { PassengerSection } from "../components/checkout/PassengerSection";
import { EllipsisLoader } from "../components/EllipsisLoader";
import { useCheckout } from "../context/useCheckout";
import { useCartContext } from "../context/useCartContext";
import { getConfig } from "../config";
import { useGuestUserForm } from "../checkout/hooks/useGuestUserForm";
import { useCheckoutDeleteLinesMutation } from "../saleor/api.generated";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../utils/ensurePlatformFeeInCheckout";

const Checkout = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { checkout, fetching: fetchingCheckout, refetch } = useCheckout();
  const { refreshCart } = useCartContext();
  const [deleteCheckoutLines] = useCheckoutDeleteLinesMutation();
  const [removingFeeForBack, setRemovingFeeForBack] = useState(false);

  const {
    phone,
    setPhone,
    passengers,
    setPassengers,
    handleSubmit,
    loading: isUpdating,
  } = useGuestUserForm(checkout, () => {
    setPaymentModalVisible(true);
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);

  const totalAmount = checkout?.totalPrice?.gross?.amount ?? 0;
  const currency = checkout?.totalPrice?.gross?.currency ?? "XOF";

  if (fetchingCheckout && !checkout) {
    return (
      <View style={styles.centerContainer}>
        <EllipsisLoader color="#EB1700" />
        <Text style={styles.loadingCaption}>Chargement de votre commande...</Text>
      </View>
    );
  }

  if (!checkout || checkout.lines.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cart-outline" size={80} color="#E2E8F0" />
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => router.push("/")}
          activeOpacity={0.85}
        >
          <Text style={styles.goBackText}>Rechercher un trajet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleContinueToPayment = () => {
    if (!acceptedTerms) {
      Alert.alert("Conditions", "Veuillez accepter les conditions générales.");
      return;
    }

    if (!phone || !isValidPhoneNumber(phone)) {
      Alert.alert("Contact", "Veuillez entrer un numéro de téléphone valide.");
      return;
    }

    const incomplete = passengers.some(
      (p) => !p.firstName.trim() || !p.lastName.trim()
    );
    if (incomplete) {
      Alert.alert("Passagers", "Veuillez remplir les noms de tous les passagers.");
      return;
    }

    handleSubmit();
  };

  const handleBackFromCheckout = async () => {
    if (removingFeeForBack) return;

    setRemovingFeeForBack(true);
    try {
      if (checkout?.id) {
        const feeLineIds =
          checkout.lines
            ?.filter((line) => line?.variant?.product?.slug === PLATFORM_FEE_PRODUCT_SLUG)
            .map((line) => line.id) ?? [];

        if (feeLineIds.length > 0) {
          const res = await deleteCheckoutLines({
            variables: { checkoutId: checkout.id, lineIds: feeLineIds },
          });
          const errs = res.data?.checkoutLinesDelete?.errors ?? [];
          if (errs.length > 0) {
            console.error("checkoutLinesDelete:", errs);
          }
          await refreshCart();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      router.back();
    }
  };

  return (
    <StripeProvider publishableKey={getConfig().stripePK}>
      <View style={styles.screen}>
        <RNView style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={handleBackFromCheckout}
            style={styles.headerIconBtn}
            disabled={removingFeeForBack}
          >
            {removingFeeForBack ? (
              <EllipsisLoader color="#000000" dotSize={5} />
            ) : (
              <Ionicons name="arrow-back" size={22} color="#000000" />
            )}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Validation commande</Text>
          <RNView style={styles.headerSpacer} />
        </RNView>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <RNView style={styles.sectionShell}>
            <Summary
              lines={checkout.lines}
              totalPrice={checkout.totalPrice}
              editable={false}
              voucherCode={checkout.voucherCode}
              giftCards={[]}
              shippingPrice={null}
            />
          </RNView>

          <RNView style={styles.sectionShell}>
            <PromoCodeAdd checkoutId={checkout.id} onSuccess={refetch} />
          </RNView>

          <RNView style={styles.sectionShell}>
            <ContactSection phone={phone} setPhone={setPhone} />
          </RNView>

          <RNView style={styles.sectionShell}>
            <PassengerSection passengers={passengers} setPassengers={setPassengers} />
          </RNView>

          <RNView style={styles.sectionShell}>
            <PaddedView style={styles.termsSection}>
              <View style={styles.termsToggleContainer}>
                <TouchableOpacity
                  style={styles.termsHeader}
                  onPress={() => setTermsOpen(!termsOpen)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.termsHeaderText}>Conditions de vente</Text>
                  <Ionicons
                    name={termsOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.green}
                  />
                </TouchableOpacity>

                {termsOpen && (
                  <View style={styles.termsContentBox}>
                    <Text style={styles.termsText}>
                      Toutes les réservations sont soumises aux conditions de vente. Billets non
                      remboursables et non échangeables.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.checkboxRow}>
                <Switch
                  value={acceptedTerms}
                  onValueChange={setAcceptedTerms}
                  trackColor={{ false: colors.grey300, true: colors.secondary }}
                  thumbColor="#FFFFFF"
                />
                <Text style={styles.checkboxLabel}>
                  {"J'accepte les conditions générales."}
                </Text>
              </View>
            </PaddedView>
          </RNView>
        </ScrollView>

        <RNView
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <TouchableOpacity
            style={[
              styles.payButton,
              (!acceptedTerms || isUpdating) && styles.payButtonDisabled,
            ]}
            onPress={handleContinueToPayment}
            disabled={!acceptedTerms || isUpdating}
            activeOpacity={0.85}
          >
            {isUpdating ? (
              <EllipsisLoader color="#FFFFFF" dotSize={7} />
            ) : (
              <Text style={styles.payButtonText}>Continuer vers le paiement</Text>
            )}
          </TouchableOpacity>
        </RNView>

        <PaymentModal
          visible={isPaymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          totalAmount={`${totalAmount} ${currency}`}
        />
      </View>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1F1F1" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 40,
  },
  loadingCaption: {
    marginTop: 12,
    fontFamily: "TTNormsPro-Regular",
    fontSize: 14,
    color: "#606060",
  },
  emptyTitle: {
    fontSize: 20,
    color: "#000000",
    marginTop: 20,
    fontFamily: "TTNormsPro-Bold",
    textAlign: "center",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
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
    fontSize: 16,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
  },
  headerSpacer: { width: 36 },
  scroll: { flex: 1, backgroundColor: "#F1F1F1" },
  scrollContent: { paddingTop: 12, paddingBottom: 24 },
  sectionShell: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    overflow: "hidden",
  },
  termsSection: {
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  termsToggleContainer: { marginBottom: 16 },
  termsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  termsHeaderText: {
    color: colors.green,
    fontFamily: "TTNormsPro-Bold",
    fontSize: 15,
  },
  termsContentBox: {
    backgroundColor: "#F1F1F1",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D7D8DB",
  },
  termsText: {
    fontSize: 12,
    color: "#606060",
    lineHeight: 18,
    fontFamily: "TTNormsPro-Regular",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
    fontFamily: "TTNormsPro-Regular",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#D7D8DB",
  },
  payButton: {
    backgroundColor: "#EB1700",
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  payButtonDisabled: { opacity: 0.45 },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
  },
});

export default Checkout;
