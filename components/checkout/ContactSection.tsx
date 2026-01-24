import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { PaddedView, Text } from '../Themed';

interface ContactSectionProps {
  phone: string;
  setPhone: (val: string) => void;
}

export const ContactSection = ({ phone, setPhone }: ContactSectionProps) => (
  <PaddedView style={styles.section}>
    <Text style={styles.sectionTitle}>Informations de contact</Text>
    <View style={styles.inputContainer}>
        <Text style={styles.label}>Numéro de téléphone <Text style={{color: 'red'}}>*</Text></Text>
        <TextInput
        placeholder="+225 ..."
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(val) => setPhone(val.startsWith('+') ? val : `+${val}`)}
        />
    </View>
  </PaddedView>
);

const styles = StyleSheet.create({
  section: { backgroundColor: 'white', marginBottom: 8, paddingVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
  inputContainer: { marginTop: 5 },
  label: { fontSize: 14, fontWeight: '500', color: '#64748B', marginBottom: 8 },
  input: { 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16,
    backgroundColor: '#F8FAFC' 
  },
});