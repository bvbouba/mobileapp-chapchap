import React from 'react';
import { Image, ImageBackground, Platform, StyleSheet, View } from 'react-native';

/** Logo brand green (#A6C65A). iOS overlays read stronger — tune per platform. */
const OVERLAY_GREEN_OPACITY = Platform.select({
  ios: 0,
  android: 0,
  default: 0.55,
}) as number;

const OVERLAY_GREEN = `rgba(166, 198, 90, ${OVERLAY_GREEN_OPACITY})`;

const HeroHeader = () => {
  return (
    <View style={styles.topHalf}>
      <ImageBackground
        source={require('../../assets/images/hero-header.jpg')}
        style={styles.heroBg}
        imageStyle={styles.heroImage}
      >
        <View style={[styles.overlaySoft, { backgroundColor: OVERLAY_GREEN }]} />

       <View style={styles.logoRow}>
          <Image
            source={require('../../assets/images/logo/5.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="ChapTicket"
          />
        </View> 
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  topHalf: {
    flex: 1,
    backgroundColor: '#A6C65A',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroBg: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderColor: 'red',
    borderWidth: 1,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  overlaySoft: {
    ...StyleSheet.absoluteFillObject,
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 30,
    zIndex: 1,
  },
  logo: {
    width: 220,
    height: 80,
  },
});

export default HeroHeader;
