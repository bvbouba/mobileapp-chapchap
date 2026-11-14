import { StyleSheet, View } from "react-native";
import { Text } from "../Themed";

/**
 * Simple awaiting-guichet notice (auto-refund countdown disabled for now).
 */
export function GuichetCountdownBanner({
  paidAmountLabel,
}: {
  metadata?: Array<{ key?: string | null; value?: string | null }> | null;
  paidAmountLabel?: string | null;
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>EN ATTENTE DE CONFIRMATION PAR LA GARE</Text>
      <Text style={styles.body}>
        {paidAmountLabel
          ? `Votre paiement de ${paidAmountLabel} est reçu. L'agent de guichet valide votre place — votre billet et QR code seront disponibles ensuite.`
          : "Paiement reçu — validation par la gare en cours. Votre billet et QR code seront disponibles ensuite."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  title: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: "#1D4ED8",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "TTNormsPro-Regular",
    color: "#334155",
  },
});
