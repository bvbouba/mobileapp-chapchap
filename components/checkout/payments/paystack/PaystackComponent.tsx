import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View as RNView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import PhoneInput from "react-native-phone-number-input";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  TransactionFlowStrategyEnum,
  useTransactionInitializeMutation,
  useTransactionProcessMutation,
} from "../../../../checkout/graphql";
import { useCheckout } from "../../../../context/useCheckout";
import { useCheckoutComplete } from "../../../../checkout/hooks/useCheckoutComplete";
import { usePhoneCountryPickerProps } from "../../../../utils/phoneInputCountryPicker";
import { Text, colors } from "../../../Themed";
import {
  CI_MOMO_PROVIDERS,
  CiMomoProvider,
  detectCiMomoProviderFromPhone,
  maskCiPhone,
  paystackGatewayId,
  PaystackMomoInitializeData,
} from "./types";

const POLL_MS = 5000;
const WAIT_SECONDS = 180; // 3 minutes

function resolveCheckoutEmail(checkout: {
  email?: string | null;
  billingAddress?: { phone?: string | null } | null;
} | null | undefined): string {
  if (checkout?.email) return checkout.email;
  const phone = checkout?.billingAddress?.phone;
  if (phone) return `${phone.replace("+", "")}@chapchapticket.com`;
  return "customer@chapchapticket.com";
}

function formatPayAmount(
  amount?: number | null,
  currency?: string | null,
): string {
  if (amount == null || !Number.isFinite(amount)) return "";
  const cur =
    (currency || "XOF").toUpperCase() === "XOF" ? "FCFA" : currency || "";
  return `${Math.round(amount).toLocaleString("fr-FR")} ${cur}`.trim();
}

function formatCountdown(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

export const PaystackComponent = () => {
  const insets = useSafeAreaInsets();
  const phoneCountryPickerProps = usePhoneCountryPickerProps();
  const { checkout, refetch } = useCheckout();
  const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();

  const [transactionInitialize, initResult] = useTransactionInitializeMutation();
  const [transactionProcess, processResult] = useTransactionProcessMutation();

  const initialPhone = checkout?.billingAddress?.phone || "";
  const detectedInitial = detectCiMomoProviderFromPhone(initialPhone);

  const [provider, setProvider] = useState<CiMomoProvider>(
    detectedInitial || "wave",
  );
  const [providerLockedToWave, setProviderLockedToWave] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [waiting, setWaiting] = useState(false);
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);
  const finishingRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const phoneInputRef = useRef<PhoneInput>(null);

  const amountLabel = formatPayAmount(
    checkout?.totalPrice?.gross?.amount,
    checkout?.totalPrice?.gross?.currency,
  );
  const selectedMeta = useMemo(
    () => CI_MOMO_PROVIDERS.find((p) => p.code === provider),
    [provider],
  );

  // Prefill / sync phone when checkout loads.
  useEffect(() => {
    const fromCheckout = checkout?.billingAddress?.phone || "";
    if (fromCheckout && !phone) {
      setPhone(fromCheckout);
      const detected = detectCiMomoProviderFromPhone(fromCheckout);
      if (detected && !providerLockedToWave) setProvider(detected);
    }
  }, [checkout?.billingAddress?.phone]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const applyPhoneChange = (next: string) => {
    setPhone(next);
    if (providerLockedToWave) return;
    const detected = detectCiMomoProviderFromPhone(next);
    if (detected) setProvider(detected);
  };

  const selectProvider = (code: CiMomoProvider) => {
    setProvider(code);
    setProviderLockedToWave(code === "wave");
  };

  const busy =
    initResult.loading ||
    processResult.loading ||
    completingCheckout ||
    finishingRef.current;

  const stopTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
  };

  const finishPayment = useCallback(
    async (
      pspReference: string,
      txnId: string,
      { silent }: { silent?: boolean } = {},
    ) => {
      if (finishingRef.current) return false;
      finishingRef.current = true;

      try {
        const { data } = await transactionProcess({
          variables: {
            id: txnId,
            data: { reference: pspReference },
          },
        });

        if (data?.transactionProcess?.errors?.length) {
          if (!silent) {
            Alert.alert(
              "Paiement",
              data.transactionProcess.errors[0].message ||
                "Vérification du paiement échouée.",
            );
          }
          finishingRef.current = false;
          return false;
        }

        const eventType = data?.transactionProcess?.transactionEvent?.type;
        const failed =
          eventType === "CHARGE_FAILURE" ||
          eventType === "AUTHORIZATION_FAILURE";

        if (failed) {
          stopTimers();
          setWaiting(false);
          Alert.alert(
            "Paiement refusé",
            data?.transactionProcess?.transactionEvent?.message ||
              "Le paiement n'a pas abouti.",
          );
          finishingRef.current = false;
          return false;
        }

        if (
          eventType === "CHARGE_ACTION_REQUIRED" ||
          eventType === "AUTHORIZATION_ACTION_REQUIRED"
        ) {
          finishingRef.current = false;
          return false;
        }

        stopTimers();
        setWaiting(false);
        await refetch?.();
        const result = await onCheckoutComplete();
        if (result?.apiErrors?.length) {
          Alert.alert("Commande", result.apiErrors[0].message);
          finishingRef.current = false;
          return false;
        }
        return true;
      } catch (err) {
        console.error("Paystack MoMo finish error:", err);
        if (!silent) {
          Alert.alert("Erreur", "Impossible de finaliser le paiement.");
        }
        finishingRef.current = false;
        return false;
      }
    },
    [transactionProcess, onCheckoutComplete, refetch],
  );

  const startPolling = (pspReference: string, txnId: string) => {
    stopTimers();
    setSecondsLeft(WAIT_SECONDS);
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    let attempts = 0;
    pollRef.current = setInterval(() => {
      attempts += 1;
      if (attempts > Math.ceil((WAIT_SECONDS * 1000) / POLL_MS)) {
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      void finishPayment(pspReference, txnId, { silent: true });
    }, POLL_MS);
  };

  const onPay = async () => {
    if (!checkout?.id) {
      Alert.alert("Erreur", "Session de commande introuvable.");
      return;
    }

    const formattedPhone = phone.replace(/\s+/g, "");

    if (!formattedPhone || !isValidPhoneNumber(formattedPhone)) {
      Alert.alert(
        "Téléphone",
        "Entrez un numéro Mobile Money valide avec l'indicatif du pays.",
      );
      return;
    }

    finishingRef.current = false;

    try {
      const { data } = await transactionInitialize({
        variables: {
          checkoutId: checkout.id,
          // MoMo has no real pre-auth — Charge is allowed on storefront checkouts.
          action: TransactionFlowStrategyEnum.Charge,
          paymentGateway: {
            id: paystackGatewayId,
            data: {
              email: resolveCheckoutEmail(checkout),
              checkoutId: checkout.id,
              phone: formattedPhone,
              provider,
            },
          },
        },
      });

      if (data?.transactionInitialize?.errors?.length) {
        Alert.alert(
          "Paiement refusé",
          data.transactionInitialize.errors[0].message || "",
        );
        return;
      }

      const payload = data?.transactionInitialize?.data as
        | PaystackMomoInitializeData
        | null
        | undefined;
      const txnId = data?.transactionInitialize?.transaction?.id;
      const eventMessage =
        data?.transactionInitialize?.transactionEvent?.message;
      const ref = payload?.reference;

      if (payload?.exception || !ref || !txnId) {
        Alert.alert(
          "Paystack",
          eventMessage ||
            payload?.displayText ||
            "Impossible de démarrer le paiement Mobile Money.",
        );
        return;
      }

      setReference(ref);
      setTransactionId(txnId);
      setDisplayText(
        payload.displayText ||
          eventMessage ||
          "Validez le paiement sur votre téléphone.",
      );
      setWaiting(true);

      if (payload.openUrl) {
        try {
          await Linking.openURL(payload.openUrl);
        } catch {
          /* Wave URL optional */
        }
      }

      startPolling(ref, txnId);
    } catch (err) {
      console.error("Paystack MoMo initialize error:", err);
      Alert.alert("Erreur", "Impossible de démarrer le paiement Mobile Money.");
    }
  };

  const onConfirmPaid = () => {
    if (!reference || !transactionId) return;
    void finishPayment(reference, transactionId, { silent: false });
  };

  const cancelWaiting = () => {
    stopTimers();
    setWaiting(false);
    finishingRef.current = false;
  };

  const ctaLabel = amountLabel
    ? `Payer ${amountLabel} avec ${selectedMeta?.shortLabel || "Mobile Money"}`
    : `Payer avec ${selectedMeta?.shortLabel || "Mobile Money"}`;

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
        >
          <Text style={styles.sectionLabel}>Moyen de paiement</Text>
          <Text style={styles.sectionHint}>Sélectionnez votre opérateur :</Text>

          <RNView style={styles.providerList}>
            {CI_MOMO_PROVIDERS.map((item) => {
              const selected = provider === item.code;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => selectProvider(item.code)}
                  style={[
                    styles.providerRow,
                    selected && styles.providerRowSelected,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={selected ? colors.primary : "#D7D8DB"}
                  />
                  <RNView style={styles.providerLogoBox}>
                    <Image
                      source={item.logo}
                      style={styles.providerLogo}
                      resizeMode="contain"
                    />
                  </RNView>
                  <Text
                    style={[
                      styles.providerName,
                      selected && styles.providerNameSelectedText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </RNView>

          <Text style={styles.fieldLabel}>
            Numéro de téléphone pour le débit
          </Text>
          <PhoneInput
            ref={phoneInputRef}
            defaultValue={phone}
            defaultCode="CI"
            layout="first"
            onChangeFormattedText={applyPhoneChange}
            containerStyle={styles.phoneInputContainer}
            textContainerStyle={styles.phoneTextContainer}
            textInputStyle={styles.phoneTextInput}
            codeTextStyle={styles.phoneCodeText}
            filterProps={phoneCountryPickerProps.filterProps}
            countryPickerProps={phoneCountryPickerProps}
            placeholder="Numéro de téléphone"
            textInputProps={{
              onFocus: () => {
                setTimeout(
                  () => scrollRef.current?.scrollToEnd({ animated: true }),
                  100,
                );
              },
            }}
          />
          {checkout?.billingAddress?.phone ? (
            <Text style={styles.prefillHint}>
              Pré-rempli depuis la fiche contact
            </Text>
          ) : null}

          <RNView style={styles.tipBox}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={18}
              color={colors.primary}
            />
            <RNView style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Comment valider ?</Text>
              <Text style={styles.tipBody}>
                {selectedMeta?.tip ||
                  "Vous recevrez une notification ou un SMS d'autorisation sur votre téléphone."}
              </Text>
            </RNView>
          </RNView>

          <Pressable
            onPress={onPay}
            disabled={busy}
            style={[styles.payButton, busy && styles.payButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <RNView style={styles.payButtonInner}>
                <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                <Text style={styles.payButtonText}>{ctaLabel}</Text>
              </RNView>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={waiting}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={cancelWaiting}
      >
        <RNView style={styles.waitOverlay}>
          <RNView style={styles.waitCard}>
            {selectedMeta ? (
              <Image
                source={selectedMeta.logo}
                style={styles.waitLogo}
                resizeMode="contain"
              />
            ) : (
              <MaterialCommunityIcons
                name="cellphone-check"
                size={40}
                color={colors.primary}
              />
            )}
            <Text style={styles.waitEyebrow}>Confirmation requise</Text>
            <Text style={styles.waitTitle}>
              Demande
              {amountLabel ? ` de ${amountLabel}` : ""} envoyée vers{" "}
              {selectedMeta?.shortLabel || "Mobile Money"}
            </Text>
            <Text style={styles.waitPhone}>{maskCiPhone(phone)}</Text>
            <Text style={styles.waitBody}>
              {provider === "wave"
                ? "Veuillez ouvrir l'application Wave (ou valider la notification) pour terminer."
                : displayText ||
                  "Veuillez valider la transaction sur votre téléphone pour terminer."}
            </Text>

            <RNView style={styles.waitTimer}>
              <Ionicons name="hourglass-outline" size={16} color="#606060" />
              <Text style={styles.waitTimerText}>
                Attente… {formatCountdown(secondsLeft)}
              </Text>
            </RNView>

            {(initResult.loading ||
              processResult.loading ||
              completingCheckout) && (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 8 }}
              />
            )}

            <Pressable
              onPress={onConfirmPaid}
              disabled={busy}
              style={styles.waitConfirmBtn}
            >
              <Text style={styles.waitConfirmText}>
                J&apos;ai confirmé le paiement
              </Text>
            </Pressable>

            <Pressable onPress={cancelWaiting} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          </RNView>
        </RNView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: "#404040",
    fontFamily: "TTNormsPro-Regular",
    marginBottom: 12,
  },
  providerList: {
    gap: 10,
    marginBottom: 18,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F7F7F8",
    borderWidth: 1.5,
    borderColor: "#E2E3E7",
  },
  providerRowSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
  },
  providerLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    overflow: "hidden",
  },
  providerLogo: {
    width: 28,
    height: 28,
  },
  providerName: {
    flex: 1,
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  providerNameSelectedText: {
    color: "#111111",
  },
  fieldLabel: {
    fontSize: 13,
    color: "#606060",
    marginBottom: 8,
    fontFamily: "TTNormsPro-Regular",
  },
  phoneInputContainer: {
    width: "100%",
    height: 56,
    backgroundColor: "#F7F7F8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    overflow: "hidden",
  },
  phoneTextContainer: {
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  phoneTextInput: {
    fontSize: 16,
    color: "#111111",
    fontFamily: "TTNormsPro-Regular",
  },
  phoneCodeText: {
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: "#111111",
  },
  prefillHint: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  tipBox: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFF7F5",
    borderWidth: 1,
    borderColor: "#FFD4CF",
  },
  tipCopy: { flex: 1 },
  tipTitle: {
    fontSize: 13,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 17,
  },
  payButton: {
    backgroundColor: colors.primary,
    minHeight: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  payButtonDisabled: { opacity: 0.7 },
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
  waitOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  waitCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  waitLogo: {
    width: 56,
    height: 56,
    marginBottom: 12,
  },
  waitEyebrow: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  waitTitle: {
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: "#111111",
    textAlign: "center",
    lineHeight: 22,
  },
  waitPhone: {
    marginTop: 8,
    fontSize: 15,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  waitBody: {
    marginTop: 12,
    fontSize: 14,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  waitTimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F7F7F8",
    borderWidth: 1,
    borderColor: "#E8E9EC",
  },
  waitTimerText: {
    fontSize: 13,
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
  },
  waitConfirmBtn: {
    marginTop: 18,
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    backgroundColor: "#F7F7F8",
    alignItems: "center",
    justifyContent: "center",
  },
  waitConfirmText: {
    fontSize: 14,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  cancelLink: { marginTop: 12, padding: 8 },
  cancelText: {
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    fontSize: 14,
  },
});
