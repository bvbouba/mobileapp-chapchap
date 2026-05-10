import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text, colors } from "../Themed";

const INPUT_BORDER = "#D7D8DB";
const INPUT_BG = "#FFFFFF";

interface PassengerSectionProps {
  passengers: { firstName: string; lastName: string }[];
  setPassengers: React.Dispatch<React.SetStateAction<{ firstName: string; lastName: string }[]>>;
}

export const PassengerSection = ({ passengers, setPassengers }: PassengerSectionProps) => {
  const updatePassenger = (index: number, field: "firstName" | "lastName", value: string) => {
    const next = [...passengers];
    next[index] = { ...next[index], [field]: value };
    setPassengers(next);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Détails du passager</Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color={colors.primary} />
        <Text style={styles.infoText}>
          {"Les noms doivent correspondre à la pièce d'identité officielle."}
        </Text>
      </View>

      {passengers.map((p, i) => (
        <View key={i} style={styles.passengerBlock}>
          <Text style={styles.passengerHeading}>Passager {i + 1}</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Nom de famille</Text>
            <TextInput
              placeholder="Dupont"
              placeholderTextColor="#606060"
              style={styles.input}
              value={p.lastName}
              onChangeText={(val) => updatePassenger(i, "lastName", val)}
              autoCapitalize="words"
              selectionColor={colors.primary}
              underlineColorAndroid="transparent"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Prénom</Text>
            <TextInput
              placeholder="Marie"
              placeholderTextColor="#606060"
              style={styles.input}
              value={p.firstName}
              onChangeText={(val) => updatePassenger(i, "firstName", val)}
              autoCapitalize="words"
              selectionColor={colors.primary}
              underlineColorAndroid="transparent"
            />
          </View>

          {i < passengers.length - 1 ? <View style={styles.betweenPassengers} /> : null}
        </View>
      ))}
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
    fontFamily: "TTNormsPro-Bold",
    marginBottom: 4,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FDE8E5",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    fontFamily: "TTNormsPro-Regular",
  },
  passengerBlock: {
    width: "100%",
  },
  passengerHeading: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 14,
    fontFamily: "TTNormsPro-Bold",
  },
  fieldBlock: {
    width: "100%",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#606060",
    marginBottom: 6,
    fontFamily: "TTNormsPro-Regular",
  },
  input: {
    width: "100%",
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
  betweenPassengers: {
    height: 1,
    backgroundColor: "#D7D8DB",
    marginBottom: 20,
    marginTop: 4,
  },
});
