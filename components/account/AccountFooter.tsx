import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Themed';

export const AccountFooter = () => (
  <View style={styles.container}>
    <View style={styles.legal}>
      <Text style={styles.text}>Légal</Text>
      <Text style={styles.dot}>•</Text>
      <Text style={styles.text}>CGU</Text>
      <Text style={styles.dot}>•</Text>
      <Text style={styles.text}>Confidentialité</Text>
    </View>
    <Text style={styles.version}>ChapChap Tickets v1.0.0 (Build 652)</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { marginTop: 40, alignItems: 'center', paddingBottom: 30 },
  legal: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  text: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  dot: { color: '#CBD5E1', fontSize: 10 },
  version: { fontSize: 11, color: '#CBD5E1' },
});