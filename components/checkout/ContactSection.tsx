import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import PhoneInput from "react-native-phone-number-input";
import { Text, colors } from "../Themed";
import { usePhoneCountryPickerProps } from "../../utils/phoneInputCountryPicker";

interface ContactSectionProps {
  phone: string;
  setPhone: (val: string) => void;
}

export const ContactSection = ({ phone, setPhone }: ContactSectionProps) => {
  const phoneInput = useRef<PhoneInput>(null);
  const phoneCountryPickerProps = usePhoneCountryPickerProps();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informations de contact</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Numéro de téléphone <Text style={{ color: colors.red }}>*</Text>
        </Text>
        <PhoneInput
          ref={phoneInput}
          defaultValue={phone}
          defaultCode="CI"
          layout="first"
          onChangeFormattedText={(text) => setPhone(text)}
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
    fontSize: 20,
    color: "#000000",
    marginBottom: 14,
    fontFamily: "TTNormsPro-Bold",
  },
  inputContainer: { marginTop: 5 },
  label: {
    fontSize: 14,
    color: "#606060",
    marginBottom: 8,
    fontFamily: "TTNormsPro-Regular",
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
  phoneTextInput: {
    fontSize: 16,
    color: colors.text,
    fontFamily: "TTNormsPro-Regular",
  },
  phoneCodeText: {
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
  },
});
