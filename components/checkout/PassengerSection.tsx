import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text, colors } from "../Themed";
import type { PassengerRecord } from "../../utils/passengersMetadata";

const INPUT_BORDER = "#D7D8DB";
const INPUT_BG = "#FFFFFF";

interface PassengerSectionProps {
  passengers: PassengerRecord[];
  setPassengers: React.Dispatch<React.SetStateAction<PassengerRecord[]>>;
  profileFirstName?: string;
  profileLastName?: string;
}

export const PassengerSection = ({
  passengers,
  setPassengers,
  profileFirstName = "",
  profileLastName = "",
}: PassengerSectionProps) => {
  const [isPrincipal, setIsPrincipal] = useState(false);

  const updatePassenger = (
    index: number,
    field: "firstName" | "lastName",
    value: string,
  ) => {
    const next = [...passengers];
    next[index] = { ...next[index], [field]: value };
    setPassengers(next);
    if (index === 0) setIsPrincipal(false);
  };

  const applyPrincipal = (enabled: boolean) => {
    setIsPrincipal(enabled);
    if (!enabled || passengers.length === 0) return;
    const next = [...passengers];
    next[0] = {
      firstName: profileFirstName.trim(),
      lastName: profileLastName.trim(),
    };
    setPassengers(next);
  };

  const canUseProfile =
    Boolean(profileFirstName?.trim()) || Boolean(profileLastName?.trim());

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Passagers ({passengers.length || 1})
      </Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color={colors.primary} />
        <Text style={styles.infoText}>
          Les noms doivent être identiques à la pièce d&apos;identité.
        </Text>
      </View>

      {passengers.map((p, i) => (
        <View key={i} style={styles.passengerBlock}>
          <Text style={styles.passengerHeading}>
            Passager {i + 1}
            {i === 0 ? " (Principal)" : ""}
          </Text>

          {i === 0 && canUseProfile ? (
            <View style={styles.principalRow}>
              <Switch
                value={isPrincipal}
                onValueChange={applyPrincipal}
                trackColor={{ false: "#D7D8DB", true: colors.secondary }}
                thumbColor="#FFFFFF"
              />
              <Text style={styles.principalLabel}>
                Je suis le passager principal
              </Text>
            </View>
          ) : null}

          <View style={styles.nameRow}>
            <View style={[styles.fieldBlock, styles.fieldHalf]}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <TextInput
                placeholder="ex: Kouassi"
                placeholderTextColor="#909090"
                style={styles.input}
                value={p.lastName}
                onChangeText={(val) => updatePassenger(i, "lastName", val)}
                autoCapitalize="words"
                selectionColor={colors.primary}
                underlineColorAndroid="transparent"
              />
            </View>
            <View style={[styles.fieldBlock, styles.fieldHalf]}>
              <Text style={styles.fieldLabel}>Prénom</Text>
              <TextInput
                placeholder="ex: Jean-Marc"
                placeholderTextColor="#909090"
                style={styles.input}
                value={p.firstName}
                onChangeText={(val) => updatePassenger(i, "firstName", val)}
                autoCapitalize="words"
                selectionColor={colors.primary}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>

          {i < passengers.length - 1 ? (
            <View style={styles.betweenPassengers} />
          ) : null}
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
    fontSize: 16,
    color: "#111111",
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
    marginBottom: 16,
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
    fontSize: 15,
    color: "#111111",
    marginBottom: 10,
    fontFamily: "TTNormsPro-Bold",
  },
  principalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  principalLabel: {
    flex: 1,
    fontSize: 13,
    color: "#404040",
    fontFamily: "TTNormsPro-Regular",
  },
  nameRow: {
    flexDirection: "row",
    gap: 10,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#606060",
    marginBottom: 6,
    fontFamily: "TTNormsPro-Regular",
  },
  input: {
    width: "100%",
    minHeight: 48,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: INPUT_BG,
    color: "#111111",
    fontFamily: "TTNormsPro-Regular",
  },
  betweenPassengers: {
    height: 1,
    backgroundColor: "#E8E9EC",
    marginBottom: 16,
    marginTop: 4,
  },
});
