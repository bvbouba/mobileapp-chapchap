import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Text, colors } from "../Themed";

const INPUT_BORDER = "#D7D8DB";
const INPUT_BG = "#FFFFFF";

interface ContactSectionProps {
  phone: string;
  setPhone: (val: string) => void;
}

export const ContactSection = ({ phone, setPhone }: ContactSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Informations de contact</Text>
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        Numéro de téléphone <Text style={{ color: colors.red }}>*</Text>
      </Text>
      <TextInput
        placeholder="+225 ..."
        placeholderTextColor="#606060"
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(val) => setPhone(val.startsWith("+") ? val : `+${val}`)}
        selectionColor={colors.primary}
        underlineColorAndroid="transparent"
      />
    </View>
  </View>
);

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
  input: {
    alignSelf: "stretch",
    minHeight: 48,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: INPUT_BG,
    color: "#000000",
    fontFamily: "TTNormsPro-Regular",
  },
});