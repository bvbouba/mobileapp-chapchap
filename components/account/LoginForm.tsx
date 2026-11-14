import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Switch,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors } from "../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useAuth } from "../../lib/providers/authProvider";
import PhoneInput from "react-native-phone-number-input";
import { getConfig } from "../../config";
import { EllipsisLoader } from "../EllipsisLoader";
import { usePhoneCountryPickerProps } from "../../utils/phoneInputCountryPicker";
import { getPasswordResetUrl } from "../../lib/storefrontContent";

const appName = getConfig().appName;

interface Props {
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<Props> = ({ onClose, onSwitchToSignup }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  /** When true, show password form even if a biometric session exists. */
  const [preferPassword, setPreferPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const autoPrompted = useRef(false);
  const phoneInput = useRef<PhoneInput>(null);
  const {
    login,
    error: authError,
    loading: authLoading,
    biometricAvailable,
    biometricLoginReady,
    biometricLabel,
    unlockWithBiometrics,
  } = useAuth();
  const insets = useSafeAreaInsets();
  const phoneCountryPickerProps = usePhoneCountryPickerProps();

  const showBiometricGate = biometricLoginReady && !preferPassword;

  const runBiometricUnlock = async () => {
    setLocalError(null);
    setBiometricBusy(true);
    try {
      const ok = await unlockWithBiometrics();
      if (ok) onClose();
    } finally {
      setBiometricBusy(false);
    }
  };

  useEffect(() => {
    if (authLoading || !showBiometricGate || autoPrompted.current) return;
    autoPrompted.current = true;
    void runBiometricUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, showBiometricGate]);

  useEffect(() => {
    if (!biometricLoginReady) {
      autoPrompted.current = false;
      setPreferPassword(false);
    }
  }, [biometricLoginReady]);

  const handleLogin = async () => {
    const normalizedPhone = phoneNumber.replace(/\s+/g, "").trim();

    if (!normalizedPhone || !isValidPhoneNumber(normalizedPhone)) {
      setLocalError("Le numéro de téléphone n'est pas valide.");
      return;
    }
    if (!password) {
      setLocalError("Veuillez saisir votre mot de passe.");
      return;
    }

    setLocalError(null);
    try {
      const virtualEmail = `${normalizedPhone}@chapchapticket.com`;
      const res = await login(
        { email: virtualEmail, password: password },
        { enableBiometrics: enableBiometrics && biometricAvailable },
      );
      if (res) onClose();
    } catch {
      setLocalError("Une erreur est survenue lors de la connexion.");
    }
  };

  const displayError = localError || authError;
  const busy = authLoading || biometricBusy;
  const biometricIcon =
    biometricLabel === "empreinte" || biometricLabel === "Touch ID"
      ? "fingerprint"
      : "face-recognition";

  const closeHeader = (
    <View style={styles.header}>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.blue} />
      </Pressable>
      <Text style={styles.appName}>{appName}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (showBiometricGate) {
    return (
      <View
        style={[
          styles.flex,
          styles.gateScreen,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <StatusBar barStyle="dark-content" />
        {closeHeader}

        <View style={styles.gateBody}>
          <Text style={styles.mainTitle}>Connexion</Text>
          <Text style={styles.lead}>Bon retour. Déverrouillez votre session.</Text>

          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name={biometricIcon} size={40} color={colors.grey500} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.biometricCta,
              busy && styles.disabledBtn,
              pressed && !busy && { opacity: 0.92 },
            ]}
            onPress={() => void runBiometricUnlock()}
            disabled={busy}
          >
            {biometricBusy ? (
              <EllipsisLoader color="#FFFFFF" dotSize={6} />
            ) : (
              <>
                <MaterialCommunityIcons name={biometricIcon} size={20} color="#FFFFFF" />
                <Text style={styles.biometricCtaText} numberOfLines={1}>
                  Se connecter avec {biometricLabel}
                </Text>
              </>
            )}
          </Pressable>

          {displayError ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.red} />
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          <View style={styles.gateDivider} />

          <Pressable
            onPress={() => {
              setPreferPassword(true);
              setLocalError(null);
              autoPrompted.current = true;
            }}
            accessibilityRole="button"
            hitSlop={12}
          >
            <Text style={styles.passwordFallback}>Utiliser un mot de passe</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <StatusBar barStyle="dark-content" />
      <View
        style={[
          styles.flex,
          styles.passwordScreen,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {closeHeader}

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formCenter}>
            <Text style={styles.mainTitle}>Connexion</Text>
            <Text style={styles.lead}>Utilisez le numéro associé à votre compte.</Text>

            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <MaterialCommunityIcons name="cellphone" size={16} color={colors.grey500} />
                <Text style={styles.fieldLabel}>Téléphone</Text>
              </View>
              <PhoneInput
                ref={phoneInput}
                defaultValue={phoneNumber}
                defaultCode="CI"
                layout="first"
                onChangeFormattedText={(text) => {
                  setPhoneNumber(text);
                  if (localError) setLocalError(null);
                }}
                containerStyle={styles.phoneInputContainer}
                textContainerStyle={styles.phoneTextContainer}
                textInputStyle={styles.phoneTextInput}
                codeTextStyle={styles.phoneCodeText}
                filterProps={phoneCountryPickerProps.filterProps}
                countryPickerProps={phoneCountryPickerProps}
                placeholder="Numéro de téléphone"
              />
            </View>

            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <MaterialCommunityIcons name="lock-outline" size={16} color={colors.grey500} />
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Mot de passe oublié",
                      "Vous allez ouvrir le site ChapChap pour réinitialiser votre mot de passe.",
                      [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Continuer",
                          onPress: async () => {
                            try {
                              await Linking.openURL(getPasswordResetUrl());
                            } catch {
                              Alert.alert(
                                "Erreur",
                                "Impossible d'ouvrir la page de réinitialisation.",
                              );
                            }
                          },
                        },
                      ],
                    );
                  }}
                  hitSlop={8}
                  accessibilityRole="link"
                  accessibilityLabel="Mot de passe oublié"
                >
                  <Text style={styles.forgotLink}>Oublié ?</Text>
                </Pressable>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.grey500}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (localError) setLocalError(null);
                  }}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  accessibilityLabel={
                    showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                  }
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.grey500}
                  />
                </Pressable>
              </View>
            </View>

            {biometricAvailable ? (
              <View style={styles.bioToggleRow}>
                <MaterialCommunityIcons name={biometricIcon} size={18} color={colors.grey500} />
                <Text style={styles.bioToggleTitle} numberOfLines={1}>
                  Connexion rapide ({biometricLabel})
                </Text>
                <Switch
                  value={enableBiometrics}
                  onValueChange={setEnableBiometrics}
                  trackColor={{ false: colors.grey300, true: "#FECACA" }}
                  thumbColor={enableBiometrics ? colors.red : "#f4f3f4"}
                />
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                busy && styles.disabledBtn,
                pressed && !busy && styles.submitBtnPressed,
              ]}
              onPress={handleLogin}
              disabled={busy}
            >
              {authLoading && !biometricBusy ? (
                <EllipsisLoader color="#FFFFFF" dotSize={6} />
              ) : (
                <Text style={styles.submitBtnText}>Se connecter</Text>
              )}
            </Pressable>

            {displayError ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.red} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {biometricLoginReady && preferPassword ? (
              <Pressable
                style={styles.backToBio}
                onPress={() => {
                  setPreferPassword(false);
                  autoPrompted.current = false;
                }}
              >
                <Text style={styles.backToBioText}>
                  Revenir à la connexion {biometricLabel}
                </Text>
              </Pressable>
            ) : null}

            <Pressable onPress={onSwitchToSignup} style={styles.switchBtn}>
              <Text style={styles.switchText}>
                Pas de compte ? <Text style={styles.link}>S&apos;inscrire</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  passwordScreen: {
    paddingHorizontal: 20,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  formCenter: {
    width: "100%",
  },
  gateScreen: {
    paddingHorizontal: 20,
  },
  gateBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
  mainTitle: {
    fontSize: 28,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
    marginBottom: 4,
    alignSelf: "stretch",
    textAlign: "left",
  },
  lead: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    lineHeight: 20,
    marginBottom: 20,
    alignSelf: "stretch",
    textAlign: "left",
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey300,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  biometricCta: {
    alignSelf: "stretch",
    backgroundColor: colors.blue,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  biometricCtaText: {
    flexShrink: 1,
    color: "#fff",
    fontFamily: "TTNormsPro-Bold",
    fontSize: 14,
  },
  gateDivider: {
    alignSelf: "stretch",
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey300,
    marginVertical: 22,
  },
  passwordFallback: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    textAlign: "center",
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flex: 1,
  },
  forgotLink: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: colors.red,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: 14,
    minHeight: 56,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    fontFamily: "TTNormsPro-Regular",
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bioToggleRow: {
    marginTop: 4,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey300,
  },
  bioToggleTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
  },
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
  backToBio: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 6,
  },
  backToBioText: {
    fontSize: 13,
    color: colors.blue,
    fontFamily: "TTNormsPro-Bold",
  },
  errorContainer: {
    marginTop: 12,
    alignSelf: "stretch",
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
  switchBtn: { marginTop: 24, alignItems: "center", paddingVertical: 8 },
  switchText: { color: colors.grey500, fontSize: 14, fontFamily: "TTNormsPro-Regular" },
  link: { color: colors.blue, fontFamily: "TTNormsPro-Bold" },
});
