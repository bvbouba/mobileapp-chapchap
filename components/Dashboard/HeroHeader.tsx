import React from 'react';
import { Image, ImageBackground, Platform, StyleSheet, View } from 'react-native';

/** iOS renders translucent overlays more prominently than Android — tune per platform. */
const OVERLAY_WHITE = Platform.select({
  ios: 0.58,
  android: 0.58,
  default: 0.5,
}) as number;

const HeroHeader = () => {
  return (
    <View style={styles.topHalf}>
      <ImageBackground
        source={require('../../assets/images/hero-header.jpg')}
        style={styles.heroBg}
        imageStyle={styles.heroImage}
      >
        <View
          style={[
            styles.overlaySoft,
            { backgroundColor: `rgba(255, 255, 255, ${OVERLAY_WHITE})` },
          ]}
        />

        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/images/logo/3.png')}
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
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 30,
    zIndex: 1,
  },
  logo: {
    width: 220,
    height: 80,
  },
});

export default HeroHeader;
