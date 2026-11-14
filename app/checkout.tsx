import React, { useCallback, useMemo, useState } from "react";
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
import { Text, View, colors } from "../components/Themed";
import { Summary, FinancialRecap } from "../components/checkout/Summary";
import { PromoCodeAdd } from "../components/checkout/PromoCodeAdd";
import { ContactSection } from "../components/checkout/ContactSection";
import { PassengerSection } from "../components/checkout/PassengerSection";
import { EllipsisLoader } from "../components/EllipsisLoader";
import { useCheckout } from "../context/useCheckout";
import { useCartContext } from "../context/useCartContext";
import { getConfig } from "../config";
import { useGuestUserForm } from "../checkout/hooks/useGuestUserForm";
import { useAutoApplyGiftCards } from "../checkout/hooks/useAutoApplyGiftCards";
import { useCheckoutComplete } from "../checkout/hooks/useCheckoutComplete";
import { useCheckoutDeleteLinesMutation } from "../saleor/api.generated";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../utils/ensurePlatformFeeInCheckout";
import { useAuth } from "../lib/providers/authProvider";
import { useDeviceLayout } from "../lib/layout/deviceLayout";
import {
  TabletContentShell,
  TabletSplitView,
} from "../components/layout/TabletSplitView";

function formatMoney(amount?: number | null, currency?: string | null): string {
  if (amount == null || !Number.isFinite(amount)) return "";
  const cur =
    (currency || "XOF").toUpperCase() === "XOF" ? "FCFA" : currency || "";
  return `${Math.round(amount).toLocaleString("fr-FR")} ${cur}`.trim();
}

function cancellationHoursFromCheckout(lines: any[] | undefined): number | null {
  const tripLine = lines?.find(
    (l) => l?.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
  );
  const attrs = tripLine?.variant?.product?.attributes || [];
  const found = attrs.find(
    (a: any) => (a?.attribute?.slug || "").toLowerCase() === "cancellation",
  );
  const raw =
    found?.values?.[0]?.name ||
    found?.values?.[0]?.value ||
    found?.values?.[0]?.slug ||
    "";
  const match = String(raw).replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

const Checkout = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { useTabletLayout, useSplitLayout, horizontalGutter } = useDeviceLayout();
  const { user } = useAuth();
  const { checkout, fetching: fetchingCheckout, refetch } = useCheckout();
  const { refreshCart } = useCartContext();
  const [deleteCheckoutLines] = useCheckoutDeleteLinesMutation();
  const [removingFeeForBack, setRemovingFeeForBack] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();

  const onContactReady = useCallback(async () => {
    const due = checkout?.totalPrice?.gross?.amount ?? 0;
    if (due <= 0) {
      const result = await onCheckoutComplete();
      const msg = result?.apiErrors?.[0]?.message;
      if (msg) {
        Alert.alert("Commande", msg);
      }
      return;
    }
    setPaymentModalVisible(true);
  }, [checkout?.totalPrice?.gross?.amount, onCheckoutComplete]);

  const {
    phone,
    setPhone,
    passengers,
    setPassengers,
    handleSubmit,
    loading: isUpdating,
  } = useGuestUserForm(checkout, onContactReady, user?.email);

  const onGiftCardsApplied = useCallback(() => refetch(), [refetch]);
  useAutoApplyGiftCards({
    checkoutId: checkout?.id,
    appliedGiftCards: checkout?.giftCards,
    enabled: Boolean(user?.email && checkout?.id),
    onApplied: onGiftCardsApplied,
  });

  const totalAmount = checkout?.totalPrice?.gross?.amount ?? 0;
  const isFullyCovered = totalAmount <= 0;
  const currency = checkout?.totalPrice?.gross?.currency ?? "XOF";
  const totalLabel = formatMoney(totalAmount, currency);
  const footerBusy = isUpdating || completingCheckout;

  const cancelHours = useMemo(
    () => cancellationHoursFromCheckout(checkout?.lines),
    [checkout?.lines],
  );

  const termsDetail = useMemo(() => {
    if (cancelHours == null) {
      return "Billets modifiables ou annulables sous forme d'avoir selon la politique de la compagnie.";
    }
    if (cancelHours <= 0) {
      return "Aucune annulation possible pour ce trajet.";
    }
    return `Billets modifiables ou annulables sous forme d'avoir jusqu'à ${Math.round(cancelHours)}h avant le départ.`;
  }, [cancelHours]);

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
      (p) => !p.firstName.trim() || !p.lastName.trim(),
    );
    if (incomplete) {
      Alert.alert(
        "Passagers",
        "Veuillez remplir les noms de tous les passagers.",
      );
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
            ?.filter(
              (line) => line?.variant?.product?.slug === PLATFORM_FEE_PRODUCT_SLUG,
            )
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
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            {removingFeeForBack ? (
              <EllipsisLoader color="#000000" dotSize={5} />
            ) : (
              <Ionicons name="arrow-back" size={22} color="#000000" />
            )}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Coordonnées & Passagers</Text>
          <RNView style={styles.headerSpacer} />
        </RNView>

        {useSplitLayout ? (
          <TabletContentShell>
            <TabletSplitView
              leftFlex={0.48}
              rightFlex={0.52}
              left={
                <ScrollView
                  style={styles.scroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.scrollContent,
                    { paddingHorizontal: 8 },
                  ]}
                  keyboardShouldPersistTaps="handled"
                >
                  <RNView style={styles.sectionShell}>
                    <Summary
                      lines={checkout.lines}
                      totalPrice={checkout.totalPrice}
                      editable={false}
                      voucherCode={checkout.voucherCode}
                      giftCards={checkout.giftCards ?? []}
                      shippingPrice={null}
                    />
                  </RNView>
                  <RNView style={styles.sectionShell}>
                    <FinancialRecap
                      lines={checkout.lines}
                      totalPrice={checkout.totalPrice}
                      giftCards={checkout.giftCards ?? []}
                      voucherCode={checkout.voucherCode}
                    />
                  </RNView>
                </ScrollView>
              }
              right={
                <RNView style={{ flex: 1 }}>
                  <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.scrollContent,
                      { paddingHorizontal: 8, paddingBottom: 120 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                  >
                    <RNView style={styles.sectionShell}>
                      <ContactSection phone={phone} setPhone={setPhone} />
                    </RNView>
                    <RNView style={styles.sectionShell}>
                      <PassengerSection
                        passengers={passengers}
                        setPassengers={setPassengers}
                        profileFirstName={user?.firstName || ""}
                        profileLastName={user?.lastName || ""}
                      />
                    </RNView>
                    <RNView style={styles.sectionShell}>
                      <RNView style={styles.promoHeader}>
                        <Text style={styles.promoTitle}>Code promo / Avoir</Text>
                        {(checkout.giftCards?.length ?? 0) > 0 ? (
                          <Text style={styles.promoHint}>
                            {(checkout.giftCards?.length ?? 0) === 1
                              ? "Votre avoir a été appliqué automatiquement."
                              : "Vos avoirs ont été appliqués automatiquement."}
                          </Text>
                        ) : user?.email ? (
                          <Text style={styles.promoHint}>
                            Vos avoirs disponibles seront appliqués automatiquement.
                          </Text>
                        ) : null}
                      </RNView>
                      <PromoCodeAdd checkoutId={checkout.id} onSuccess={refetch} />
                    </RNView>
                    <RNView style={styles.sectionShell}>
                      <RNView style={styles.termsSection}>
                        <RNView style={styles.checkboxRow}>
                          <Switch
                            value={acceptedTerms}
                            onValueChange={setAcceptedTerms}
                            trackColor={{ false: colors.grey300, true: colors.secondary }}
                            thumbColor="#FFFFFF"
                          />
                          <Text style={styles.checkboxLabel}>
                            J&apos;accepte les conditions générales ({termsDetail})
                          </Text>
                        </RNView>
                      </RNView>
                    </RNView>
                  </ScrollView>
                  <RNView
                    style={[
                      styles.footer,
                      { paddingBottom: Math.max(insets.bottom, 16) },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.payButton,
                        (!acceptedTerms || footerBusy) && styles.payButtonDisabled,
                      ]}
                      onPress={handleContinueToPayment}
                      disabled={!acceptedTerms || footerBusy}
                      activeOpacity={0.85}
                    >
                      {footerBusy ? (
                        <EllipsisLoader color="#FFFFFF" dotSize={7} />
                      ) : (
                        <RNView style={styles.payButtonInner}>
                          <Ionicons
                            name={isFullyCovered ? "checkmark-circle" : "lock-closed"}
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.payButtonText}>
                            {isFullyCovered
                              ? "Valider la commande"
                              : `Continuer vers le paiement${totalLabel ? ` — ${totalLabel}` : ""}`}
                          </Text>
                        </RNView>
                      )}
                    </TouchableOpacity>
                  </RNView>
                </RNView>
              }
            />
          </TabletContentShell>
        ) : (
          <>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            useTabletLayout && {
              maxWidth: 720,
              alignSelf: "center",
              width: "100%",
              paddingHorizontal: horizontalGutter,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <RNView style={styles.sectionShell}>
            <Summary
              lines={checkout.lines}
              totalPrice={checkout.totalPrice}
              editable={false}
              voucherCode={checkout.voucherCode}
              giftCards={checkout.giftCards ?? []}
              shippingPrice={null}
            />
          </RNView>

          <RNView style={styles.sectionShell}>
            <ContactSection phone={phone} setPhone={setPhone} />
          </RNView>

          <RNView style={styles.sectionShell}>
            <PassengerSection
              passengers={passengers}
              setPassengers={setPassengers}
              profileFirstName={user?.firstName || ""}
              profileLastName={user?.lastName || ""}
            />
          </RNView>

          <RNView style={styles.sectionShell}>
            <RNView style={styles.promoHeader}>
              <Text style={styles.promoTitle}>Code promo / Avoir</Text>
              {(checkout.giftCards?.length ?? 0) > 0 ? (
                <Text style={styles.promoHint}>
                  {(checkout.giftCards?.length ?? 0) === 1
                    ? "Votre avoir a été appliqué automatiquement."
                    : "Vos avoirs ont été appliqués automatiquement."}
                </Text>
              ) : user?.email ? (
                <Text style={styles.promoHint}>
                  Vos avoirs disponibles seront appliqués automatiquement.
                </Text>
              ) : null}
            </RNView>
            <PromoCodeAdd checkoutId={checkout.id} onSuccess={refetch} />
          </RNView>

          <RNView style={styles.sectionShell}>
            <FinancialRecap
              lines={checkout.lines}
              totalPrice={checkout.totalPrice}
              giftCards={checkout.giftCards ?? []}
              voucherCode={checkout.voucherCode}
            />
          </RNView>

          <RNView style={styles.sectionShell}>
            <RNView style={styles.termsSection}>
              <RNView style={styles.checkboxRow}>
                <Switch
                  value={acceptedTerms}
                  onValueChange={setAcceptedTerms}
                  trackColor={{ false: colors.grey300, true: colors.secondary }}
                  thumbColor="#FFFFFF"
                />
                <Text style={styles.checkboxLabel}>
                  J&apos;accepte les conditions générales ({termsDetail})
                </Text>
              </RNView>
            </RNView>
          </RNView>
        </ScrollView>

        <RNView
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <TouchableOpacity
            style={[
              styles.payButton,
              (!acceptedTerms || footerBusy) && styles.payButtonDisabled,
            ]}
            onPress={handleContinueToPayment}
            disabled={!acceptedTerms || footerBusy}
            activeOpacity={0.85}
          >
            {footerBusy ? (
              <EllipsisLoader color="#FFFFFF" dotSize={7} />
            ) : (
              <RNView style={styles.payButtonInner}>
                <Ionicons
                  name={isFullyCovered ? "checkmark-circle" : "lock-closed"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.payButtonText}>
                  {isFullyCovered
                    ? "Valider la commande"
                    : `Continuer vers le paiement${totalLabel ? ` — ${totalLabel}` : ""}`}
                </Text>
              </RNView>
            )}
          </TouchableOpacity>
        </RNView>
          </>
        )}

        <PaymentModal
          visible={isPaymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          totalAmount={totalLabel || `${totalAmount} ${currency}`}
          discountHint={
            (checkout.giftCards?.length ?? 0) > 0
              ? `${checkout.giftCards!.length === 1 ? "Avoir" : "Avoirs"} appliqué${checkout.giftCards!.length > 1 ? "s" : ""} ✓`
              : checkout.voucherCode
                ? `Code ${checkout.voucherCode} appliqué ✓`
                : null
          }
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
    paddingHorizontal: 4,
  },
  headerSpacer: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24, paddingTop: 10 },
  sectionShell: {
    marginBottom: 10,
    marginHorizontal: 0,
    overflow: "hidden",
  },
  promoHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 0,
  },
  promoTitle: {
    fontSize: 13,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  promoHint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.green,
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 16,
  },
  termsSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: "#404040",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 19,
    paddingTop: 2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#D7D8DB",
  },
  payButton: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  payButtonDisabled: { opacity: 0.55 },
  payButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "TTNormsPro-Bold",
    textAlign: "center",
    flexShrink: 1,
  },
});

export default Checkout;
