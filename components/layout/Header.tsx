import React from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Themed';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* barStyle="dark-content" rend les icônes (heure, batterie) noires */}
      <StatusBar barStyle="dark-content" /> 
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
      </View>
      {/* Une fine ligne de séparation pour distinguer le header du contenu */}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF', // Fond blanc
  },
  content: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B', // Noir ardoise (très lisible)
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9', // Gris très léger pour la finition
  },
});