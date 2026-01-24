import React from 'react';
import { StyleSheet, View, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ConfirmationHeader = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    router.replace("/");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* Bouton Retour */}
        <Pressable onPress={handleBack} style={styles.leftButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#1E293B" />
        </Pressable>
        
        {/* Centre : Logo Large */}
        {/* <View style={styles.centerContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain" // Garantit que l'image n'est pas coupée
          />
        </View> */}
        
        {/* Équilibre le centrage (doit avoir la même largeur que leftButton) */}
        <View style={styles.rightPlaceholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    height: 70, // Augmenté pour laisser de la place au logo
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftButton: {
    width: 50, // Largeur fixe pour le calcul du centrage
    height: '100%',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1, // Prend tout l'espace central disponible
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,       // Largeur augmentée pour qu'il soit bien visible
    height: '100%',   // Utilise toute la hauteur du content (70px)
    aspectRatio: 3,   // Ajustez selon le ratio réel de votre logo (Largeur / Hauteur)
  },
  rightPlaceholder: {
    width: 50, // Strictement identique à leftButton.width
  }
});