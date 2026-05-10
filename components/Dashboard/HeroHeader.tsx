import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../Themed';

const HeroHeader = () => {
  return (
    <View style={styles.topHalf}>
      <ImageBackground
        source={require('../../assets/images/hero-header.jpg')}
        style={styles.heroBg}
        imageStyle={styles.heroImage}
      >
        <View style={styles.overlay} />
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="ticket-confirmation" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandName}>ChapChap Tickets</Text>
            <Text style={styles.tagline}>Voyagez simple, voyagez vite</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  topHalf: {
    flex: 1,
    backgroundColor: '#EB1700',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroBg: {
    flex: 1,
    justifyContent: 'center',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 30,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#02838A',
  },
  brandName: {
    fontSize: 30,
    color: '#fff',
    fontFamily: 'TTNormsPro-Bold',
  },
  tagline: {
    color: '#F1F1F1',
    fontSize: 14,
    marginTop: 5,
    fontFamily: 'TTNormsPro-Regular',
  },
});

export default HeroHeader;