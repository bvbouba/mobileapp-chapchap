import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors } from "../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PhoneInput from "react-native-phone-number-input";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  useSendCodeMutation,
  useUserRegisterMutation,
  useVerifyCodeMutation,
} from "../../saleor/api.generated";
import { useAuth } from "../../lib/providers/authProvider";
import { getConfig } from "../../config";
import { EllipsisLoader } from "../EllipsisLoader";

const appName = getConfig().appName;

interface Props {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const SignupForm: React.FC<Props> = ({ onClose, onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [sendCode] = useSendCodeMutation();
  const [verifyCode] = useVerifyCodeMutation();
  const [registerUser] = useUserRegisterMutation();
  const phoneInput = useRef<PhoneInput>(null);

  const handleSendOTP = async () => {
    if (!isValidPhoneNumber(phone)) {
      setError("Le numéro de téléphone n'est pas valide.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await sendCode({ variables: { phoneNumber: phone } });
      if (data?.sendOtp?.error) setError(data.sendOtp.error);
      else setStep(2);
    } catch {
      setError("Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await verifyCode({ variables: { phoneNumber: phone, otp } });
      if (data?.verifyOtp?.error) setError(data.verifyOtp.error);
      else setStep(3);
    } catch {
      setError("Code invalide.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const virtualEmail = `${phone}@chapchaptickets.com`;
      const { data } = await registerUser({
        variables: {
          input: { email: virtualEmail, password, firstName, lastName },
        },
      });

      if (data?.accountRegister?.errors?.length) {
        setError(data.accountRegister.errors[0].message || "Erreur");
      } else {
        const success = await login({ email: virtualEmail, password });
        if (success) onClose();
      }
    } catch {
      setError("L'inscription a échoué.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Téléphone", "Code", "Profil"];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.blue} />
          </Pressable>
          <Text style={styles.appName}>{appName}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.form}>
          <Text style={styles.mainTitle}>Créer un compte</Text>
          <Text style={styles.lead}>Quelques étapes pour réserver en toute simplicité.</Text>

          <View style={styles.stepRow}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.stepSegment}>
                <View style={[styles.stepDot, step >= i && styles.stepDotActive]} />
                <Text style={[styles.stepLabel, step === i && styles.stepLabelActive]}>
                  {stepLabels[i - 1]}
                </Text>
              </View>
            ))}
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.fieldLabel}>Téléphone</Text>
              <PhoneInput
                ref={phoneInput}
                defaultValue={phone}
                defaultCode="CI"
                layout="first"
                onChangeFormattedText={setPhone}
                containerStyle={styles.phoneInputContainer}
                textContainerStyle={styles.phoneTextContainer}
                textInputStyle={styles.phoneTextInput}
                codeTextStyle={styles.phoneCodeText}
                countryPickerProps={{ countryCodes: ["CI", "CA"], translation: "fra" }}
                placeholder="Numéro de téléphone"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  (!phone || loading) && styles.disabledBtn,
                  pressed && phone && !loading && styles.submitBtnPressed,
                ]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <EllipsisLoader color="#FFFFFF" dotSize={6} />
                ) : (
                  <Text style={styles.submitBtnText}>Envoyer le code</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.fieldLabel}>Code reçu par SMS</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                maxLength={6}
                keyboardType="number-pad"
                placeholder="000000"
                placeholderTextColor={colors.grey500}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  loading && styles.disabledBtn,
                  pressed && !loading && styles.submitBtnPressed,
                ]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <EllipsisLoader color="#FFFFFF" dotSize={6} />
                ) : (
                  <Text style={styles.submitBtnText}>Vérifier le code</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setStep(1)} style={styles.retryBtn}>
                <Text style={styles.retryText}>Changer de numéro</Text>
              </Pressable>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Prénom</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    placeholderTextColor={colors.grey500}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Nom</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    placeholderTextColor={colors.grey500}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={colors.grey500}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Text style={styles.fieldLabel}>Confirmation</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={colors.grey500}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  loading && styles.disabledBtn,
                  pressed && !loading && styles.submitBtnPressed,
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <EllipsisLoader color="#FFFFFF" dotSize={6} />
                ) : (
                  <Text style={styles.submitBtnText}>Finaliser l'inscription</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable onPress={onSwitchToLogin} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              Déjà un compte ? <Text style={styles.link}>Se connecter</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey300,
  },
  closeBtnPressed: { opacity: 0.85 },
  headerSpacer: { width: 44 },
  appName: {
    fontSize: 15,
    fontFamily: "TTNormsPro-Bold",
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  form: { gap: 8 },
  mainTitle: {
    fontSize: 28,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
    marginBottom: 4,
  },
  lead: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    lineHeight: 20,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  stepSegment: { flex: 1, alignItems: "center" },
  stepDot: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.grey300,
    marginBottom: 6,
  },
  stepDotActive: { backgroundColor: colors.red },
  stepLabel: {
    fontSize: 11,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    textAlign: "center",
  },
  stepLabelActive: { fontFamily: "TTNormsPro-Bold", color: colors.text },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 6,
  },
  phoneInputContainer: {
    width: "100%",
    height: 56,
    backgroundColor: colors.grey100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.grey300,
    overflow: "hidden",
  },
  phoneTextContainer: { backgroundColor: "transparent", paddingVertical: 0 },
  phoneTextInput: { fontSize: 16, color: colors.text, fontFamily: "TTNormsPro-Regular" },
  phoneCodeText: { fontSize: 16, fontFamily: "TTNormsPro-Bold", color: colors.text },
  input: {
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey300,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    fontSize: 16,
    color: colors.text,
    fontFamily: "TTNormsPro-Regular",
  },
  otpInput: { textAlign: "center", letterSpacing: 8, fontSize: 22, fontFamily: "TTNormsPro-Bold" },
  row: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1 },
  submitBtn: {
    backgroundColor: colors.red,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnPressed: { opacity: 0.94 },
  disabledBtn: { opacity: 0.55 },
  submitBtnText: { color: "#fff", fontFamily: "TTNormsPro-Bold", fontSize: 16 },
  errorContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    flex: 1,
    lineHeight: 18,
  },
  retryBtn: { marginTop: 8, alignSelf: "center", padding: 8 },
  retryText: {
    color: colors.blue,
    fontFamily: "TTNormsPro-Bold",
    fontSize: 14,
  },
  switchBtn: { marginTop: 20, alignItems: "center", paddingVertical: 8 },
  switchText: { color: colors.grey500, fontSize: 14, fontFamily: "TTNormsPro-Regular" },
  link: { color: colors.blue, fontFamily: "TTNormsPro-Bold" },
});
