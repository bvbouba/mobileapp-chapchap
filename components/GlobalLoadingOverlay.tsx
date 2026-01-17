// components/GlobalLoadingOverlay.tsx
import React from 'react';
import { View, StyleSheet, Modal, ActivityIndicator, Image } from 'react-native';
import { Text } from './Themed';

interface Props {
  visible: boolean;
  companyLogo?: string;
}

export const GlobalLoadingOverlay = ({ visible, companyLogo }: Props) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.logoRow}>
          {/* Your Brand Logo */}
          <View style={styles.logoCircle}>
             <Image source={require('../assets/images/logo.png')} style={styles.brandImg} />
          </View>

          {/* Animated Dots / Activity Indicator */}
          <ActivityIndicator size="small" color="#E11D48" style={{ marginHorizontal: 15 }} />

          {/* Partner Logo */}
          <View style={[styles.logoCircle, { backgroundColor: '#F8FAFC' }]}>
            {companyLogo ? (
              <Image source={{ uri: companyLogo }} style={styles.partnerImg} />
            ) : (
              <ActivityIndicator size="small" color="#94A3B8" />
            )}
          </View>
        </View>

        <Text style={styles.title}>Vérification des places</Text>
        <Text style={styles.subtitle}>Nous sécurisons votre trajet auprès de notre partenaire...</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center', width: '85%' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  logoCircle: { 
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden'
  },
  brandImg: { width: 40, height: 40, resizeMode: 'contain' },
  partnerImg: { width: 50, height: 50, resizeMode: 'contain' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
});