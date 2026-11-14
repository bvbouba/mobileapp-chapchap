import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import PhoneInput from "react-native-phone-number-input";
import { Ionicons } from "@expo/vector-icons";
import { Text, colors } from "../Themed";
import { usePhoneCountryPickerProps } from "../../utils/phoneInputCountryPicker";

interface ContactSectionProps {
  phone: string;
  setPhone: (val: string) => void;
}

/**
 * PhoneInput only applies defaultValue on mount. Remount at most once when an
 * external prefill arrives before the user types. Never remount on keystrokes
 * (that re-applies defaultCode and duplicates +225).
 */
export const ContactSection = ({ phone, setPhone }: ContactSectionProps) => {
  const phoneInput = useRef<PhoneInput>(null);
  const phoneCountryPickerProps = usePhoneCountryPickerProps();
  const [mountKey, setMountKey] = useState(0);
  const userEdited = useRef(false);
  const appliedExternalPrefill = useRef(Boolean(phone?.trim()));

  useEffect(() => {
    const trimmed = phone?.trim() ?? "";
    if (!trimmed || userEdited.current || appliedExternalPrefill.current) return;
    appliedExternalPrefill.current = true;
    setMountKey((k) => k + 1);
  }, [phone]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact</Text>
      <View style={styles.hintRow}>
        <Ionicons name="logo-whatsapp" size={16} color={colors.green} />
        <Text style={styles.hintText}>
          Ce numéro recevra les notifications.
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Numéro de téléphone <Text style={{ color: colors.primary }}>*</Text>
        </Text>
        <PhoneInput
          key={`contact-phone-${mountKey}`}
          ref={phoneInput}
          defaultValue={phone}
          defaultCode="CI"
          layout="first"
          onChangeFormattedText={(text) => {
            userEdited.current = true;
            setPhone(text);
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
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#111111",
    marginBottom: 8,
    fontFamily: "TTNormsPro-Bold",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    lineHeight: 17,
  },
  inputContainer: { marginTop: 2 },
  label: {
    fontSize: 13,
    color: "#606060",
    marginBottom: 8,
    fontFamily: "TTNormsPro-Regular",
  },
  phoneInputContainer: {
    width: "100%",
    height: 56,
    backgroundColor: "#F7F7F8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    overflow: "hidden",
  },
  phoneTextContainer: { backgroundColor: "transparent", paddingVertical: 0 },
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
});
