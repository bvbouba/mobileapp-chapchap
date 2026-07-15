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
import { isValidPhoneNumber } from "libphonenumber-js";
import { useAuth } from "../../lib/providers/authProvider";
import PhoneInput from "react-native-phone-number-input";
import { getConfig } from "../../config";
import { EllipsisLoader } from "../EllipsisLoader";
import { usePhoneCountryPickerProps } from "../../utils/phoneInputCountryPicker";

const appName = getConfig().appName;

interface Props {
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<Props> = ({ onClose, onSwitchToSignup }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const phoneInput = useRef<PhoneInput>(null);
  const { login, error: authError, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const phoneCountryPickerProps = usePhoneCountryPickerProps();

  const handleLogin = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      setLocalError("Le numéro de téléphone n'est pas valide.");
      return;
    }
    if (!password) {
      setLocalError("Veuillez saisir votre mot de passe.");
      return;
    }

    setLocalError(null);
    try {
      const virtualEmail = `${phoneNumber}@chapchaptickets.com`;
      const res = await login({ email: virtualEmail, password: password });
      if (res) onClose();
    } catch {
      setLocalError("Une erreur est survenue lors de la connexion.");
    }
  };

  const displayError = localError || authError;

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
          <Text style={styles.mainTitle}>Connexion</Text>
          <Text style={styles.lead}>Utilisez le numéro associé à votre compte.</Text>

          <Text style={styles.fieldLabel}>Téléphone</Text>
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

          <Text style={styles.fieldLabel}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor={colors.grey500}
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (localError) setLocalError(null);
            }}
          />

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              authLoading && styles.disabledBtn,
              pressed && !authLoading && styles.submitBtnPressed,
            ]}
            onPress={handleLogin}
            disabled={authLoading}
          >
            {authLoading ? (
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

          <Pressable onPress={onSwitchToSignup} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              Pas de compte ? <Text style={styles.link}>S'inscrire</Text>
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
    marginBottom: 24,
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
  form: { gap: 10 },
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
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 4,
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
  switchBtn: { marginTop: 24, alignItems: "center", paddingVertical: 8 },
  switchText: { color: colors.grey500, fontSize: 14, fontFamily: "TTNormsPro-Regular" },
  link: { color: colors.blue, fontFamily: "TTNormsPro-Bold" },
});
