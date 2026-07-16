import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  TransactionFlowStrategyEnum,
  useTransactionInitializeMutation,
  useTransactionProcessMutation,
} from "../../../../checkout/graphql";
import { useCheckout } from "../../../../context/useCheckout";
import { useCheckoutComplete } from "../../../../checkout/hooks/useCheckoutComplete";
import { Text, colors } from "../../../Themed";
import {
  CI_MOMO_PROVIDERS,
  CiMomoProvider,
  paystackGatewayId,
  PaystackMomoInitializeData,
} from "./types";

function resolveCheckoutEmail(checkout: {
  email?: string | null;
  billingAddress?: { phone?: string | null } | null;
} | null | undefined): string {
  if (checkout?.email) return checkout.email;
  const phone = checkout?.billingAddress?.phone;
  if (phone) return `${phone.replace("+", "")}@chapchaptickets.com`;
  return "customer@chapchaptickets.com";
}

export const PaystackComponent = () => {
  const insets = useSafeAreaInsets();
  const { checkout, refetch } = useCheckout();
  const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();

  const [transactionInitialize, initResult] = useTransactionInitializeMutation();
  const [transactionProcess, processResult] = useTransactionProcessMutation();

  const [provider, setProvider] = useState<CiMomoProvider>("orange");
  const [phone, setPhone] = useState(checkout?.billingAddress?.phone || "");
  const [waiting, setWaiting] = useState(false);
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const finishingRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (checkout?.billingAddress?.phone && !phone) {
      setPhone(checkout.billingAddress.phone);
    }
  }, [checkout?.billingAddress?.phone, phone]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const busy =
    initResult.loading ||
    processResult.loading ||
    completingCheckout ||
    finishingRef.current;

  const finishPayment = useCallback(
    async (pspReference: string, txnId: string, { silent }: { silent?: boolean } = {}) => {
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
                "Vérification du paiement échouée."
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
          if (pollRef.current) clearInterval(pollRef.current);
          setWaiting(false);
          Alert.alert(
            "Paiement refusé",
            data?.transactionProcess?.transactionEvent?.message ||
              "Le paiement n'a pas abouti."
          );
          finishingRef.current = false;
          return false;
        }

        if (
          eventType === "CHARGE_ACTION_REQUIRED" ||
          eventType === "AUTHORIZATION_ACTION_REQUIRED"
        ) {
          finishingRef.current = false;
          if (!silent) {
            Alert.alert(
              "En attente",
              data?.transactionProcess?.transactionEvent?.message ||
                "Validez encore le paiement sur votre téléphone, puis réessayez."
            );
          }
          return false;
        }

        if (pollRef.current) clearInterval(pollRef.current);
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
    [transactionProcess, onCheckoutComplete, refetch]
  );

  const startPolling = (pspReference: string, txnId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(() => {
      attempts += 1;
      if (attempts > 36) {
        // ~3 minutes at 5s
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      void finishPayment(pspReference, txnId, { silent: true });
    }, 5000);
  };

  const onPay = async () => {
    if (!checkout?.id) {
      Alert.alert("Erreur", "Session de commande introuvable.");
      return;
    }
    if (!phone || !isValidPhoneNumber(phone)) {
      Alert.alert(
        "Téléphone",
        "Entrez un numéro Mobile Money valide (ex. +22507…)."
      );
      return;
    }

    finishingRef.current = false;

    try {
      const { data } = await transactionInitialize({
        variables: {
          checkoutId: checkout.id,
          action: TransactionFlowStrategyEnum.Authorization,
          paymentGateway: {
            id: paystackGatewayId,
            data: {
              email: resolveCheckoutEmail(checkout),
              checkoutId: checkout.id,
              phone,
              provider,
            },
          },
        },
      });

      if (data?.transactionInitialize?.errors?.length) {
        Alert.alert(
          "Paiement refusé",
          data.transactionInitialize.errors[0].message || ""
        );
        return;
      }

      const payload = data?.transactionInitialize?.data as
        | PaystackMomoInitializeData
        | null
        | undefined;
      const txnId = data?.transactionInitialize?.transaction?.id;
      const eventMessage = data?.transactionInitialize?.transactionEvent?.message;
      const ref = payload?.reference;

      if (payload?.exception || !ref || !txnId) {
        Alert.alert(
          "Paystack",
          eventMessage ||
            payload?.displayText ||
            "Impossible de démarrer le paiement Mobile Money."
        );
        return;
      }

      setReference(ref);
      setTransactionId(txnId);
      setDisplayText(
        payload.displayText ||
          eventMessage ||
          "Validez le paiement sur votre téléphone."
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

  if (waiting) {
    const selectedProvider = CI_MOMO_PROVIDERS.find((p) => p.code === provider);

    return (
      <View style={styles.waitBox}>
        {selectedProvider ? (
          <Image
            source={selectedProvider.logo}
            style={styles.waitLogo}
            resizeMode="contain"
          />
        ) : null}
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.waitTitle}>Confirmez sur votre téléphone</Text>
        <Text style={styles.waitBody}>
          {displayText ||
            "Une demande a été envoyée. Approuvez le paiement dans votre app / USSD Mobile Money."}
        </Text>
        <Text style={styles.waitHint}>
          Cela peut prendre jusqu’à 3 minutes. Ne fermez pas cet écran.
        </Text>
        <Button
          mode="contained"
          onPress={onConfirmPaid}
          loading={busy}
          disabled={busy}
          style={styles.button}
          contentStyle={styles.content}
          labelStyle={styles.label}
        >
          J’AI CONFIRMÉ LE PAIEMENT
        </Button>
        <Pressable
          onPress={() => {
            if (pollRef.current) clearInterval(pollRef.current);
            setWaiting(false);
            finishingRef.current = false;
          }}
          style={styles.cancelLink}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>
      </View>
    );
  }

  return (
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
        <Text style={styles.hint}>
          Choisissez votre opérateur Mobile Money, puis validez sur votre téléphone.
        </Text>

        <Text style={styles.fieldLabel}>Opérateur</Text>
        <View style={styles.providerList}>
          {CI_MOMO_PROVIDERS.map((item) => {
            const selected = provider === item.code;
            return (
              <Pressable
                key={item.code}
                onPress={() => setProvider(item.code)}
                style={[styles.providerRow, selected && styles.providerRowSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={styles.providerLogoBox}>
                  <Image
                    source={item.logo}
                    style={styles.providerLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.providerName,
                    selected && styles.providerNameSelectedText,
                  ]}
                >
                  {item.label}
                </Text>
                <Ionicons
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={selected ? colors.green : "#D7D8DB"}
                />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Numéro Mobile Money</Text>
        <TextInput
          style={styles.phoneInput}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+2250700000000"
          placeholderTextColor="#9CA3AF"
          autoCorrect={false}
          onFocus={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          }}
        />

        <Button
          mode="contained"
          onPress={onPay}
          loading={busy}
          disabled={busy}
          style={styles.button}
          contentStyle={styles.content}
          labelStyle={styles.label}
        >
          {busy ? "ENVOI…" : "PAYER PAR MOBILE MONEY"}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  hint: {
    textAlign: "center",
    fontSize: 13,
    color: "#606060",
    marginBottom: 14,
    fontFamily: "TTNormsPro-Regular",
  },
  fieldLabel: {
    fontSize: 12,
    color: "#606060",
    marginBottom: 8,
    fontFamily: "TTNormsPro-Bold",
  },
  providerList: {
    gap: 10,
    marginBottom: 16,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F1F1F1",
    borderWidth: 1.5,
    borderColor: "#D7D8DB",
  },
  providerRowSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.green,
  },
  providerLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    overflow: "hidden",
  },
  providerLogo: {
    width: 32,
    height: 32,
  },
  providerName: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    fontFamily: "TTNormsPro-Bold",
  },
  providerNameSelectedText: {
    color: "#000",
  },
  phoneInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#000",
    fontFamily: "TTNormsPro-Regular",
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.green,
    borderRadius: 12,
    marginTop: 4,
    elevation: 0,
  },
  content: { height: 54 },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  waitBox: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  waitLogo: {
    width: 56,
    height: 56,
    marginBottom: 4,
  },
  waitTitle: {
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: "#000",
    marginTop: 8,
    textAlign: "center",
  },
  waitBody: {
    fontSize: 14,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  waitHint: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  cancelLink: { marginTop: 8, padding: 8 },
  cancelText: {
    color: "#606060",
    fontFamily: "TTNormsPro-Bold",
    fontSize: 14,
  },
});
