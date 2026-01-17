import React from 'react';
import { StyleSheet, View, ImageBackground } from 'react-native';
import { Text } from '../Themed';

const HeroHeader = () => {
  return (
    <View style={styles.topHalf}>
      <ImageBackground
        source={require('../../assets/images/hero-header.png')}
        style={styles.heroBg}
        imageStyle={{
          opacity: 0.5,
          resizeMode: 'cover',
          width: '200%',
        }}
      >
        <View style={styles.textContainer}>
          <Text style={styles.brandName}>ChapChap Tickets</Text>
          <Text style={styles.tagline}>Réservez vos billets en un clic</Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  topHalf: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  heroBg: {
    flex: 1,
    justifyContent: 'center',
  },
  textContainer: {
    paddingLeft: 30,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
});

export default HeroHeader;