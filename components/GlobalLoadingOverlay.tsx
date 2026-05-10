// components/GlobalLoadingOverlay.tsx
import React from 'react';
import { View, StyleSheet, Modal, Image } from 'react-native';
import { Text } from './Themed';
import { EllipsisLoader } from './EllipsisLoader';

interface Props {
  visible: boolean;
  companyLogo?: string;
}

export const GlobalLoadingOverlay = ({ visible, companyLogo }: Props) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    statusBarTranslucent
    navigationBarTranslucent
  >
    <View style={styles.modalRoot}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
               <Image source={require('../assets/images/logo.png')} style={styles.brandImg} />
            </View>

            <View style={{ marginHorizontal: 15 }}>
              <EllipsisLoader color="#EB1700" dotSize={7} />
            </View>

            <View style={[styles.logoCircle, { backgroundColor: '#F8FAFC' }]}>
              {companyLogo ? (
                <Image source={{ uri: companyLogo }} style={styles.partnerImg} />
              ) : (
                <EllipsisLoader color="#94A3B8" dotSize={5} />
              )}
            </View>
          </View>

          <Text style={styles.title}>Verification de disponibilite</Text>
          <Text style={styles.subtitle}>Nous verifions la disponibilite des billets...</Text>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.56)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7D8DB',
    padding: 24,
    alignItems: 'center',
    width: '86%',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  logoCircle: { 
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D7D8DB',
    overflow: 'hidden'
  },
  brandImg: { width: 40, height: 40, resizeMode: 'contain' },
  partnerImg: { width: 46, height: 46, resizeMode: 'contain' },
  title: {
    fontSize: 17,
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'TTNormsPro-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#606060',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'TTNormsPro-Regular',
  },
});