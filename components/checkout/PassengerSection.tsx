import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaddedView, Text } from '../Themed';

interface PassengerSectionProps {
  passengers: { firstName: string; lastName: string }[];
  setPassengers: React.Dispatch<React.SetStateAction<{ firstName: string; lastName: string }[]>>;
}

export const PassengerSection = ({ passengers, setPassengers }: PassengerSectionProps) => {
  const updatePassenger = (index: number, field: 'firstName' | 'lastName', value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  return (
    <PaddedView style={styles.section}>
      <Text style={styles.sectionTitle}>Détails du passager</Text>
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color="#0056b3" />
        <Text style={styles.infoText}>Les noms doivent correspondre à la pièce d'identité officielle.</Text>
      </View>

      {passengers.map((p, i) => (
        <View key={i} style={styles.passengerContainer}>
          <Text style={styles.passengerLabel}>Passager {i + 1}</Text>
          <TextInput
            placeholder="Nom de famille"
            style={styles.input}
            value={p.lastName}
            onChangeText={(val) => updatePassenger(i, 'lastName', val)}
          />
          <TextInput
            placeholder="Prénom"
            style={styles.input}
            value={p.firstName}
            onChangeText={(val) => updatePassenger(i, 'firstName', val)}
          />
        </View>
      ))}
    </PaddedView>
  );
};

const styles = StyleSheet.create({
  section: { backgroundColor: 'white', marginBottom: 8, paddingVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, alignItems: 'center', gap: 8, marginVertical: 15 },
  infoText: { flex: 1, fontSize: 12, color: '#1E40AF' },
  passengerContainer: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  passengerLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  input: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 10, marginBottom: 10, fontSize: 15 },
});