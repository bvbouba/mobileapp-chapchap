import React from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { colors, Text } from '../Themed';
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const AccountMenu = ({ isAuthenticated, onLogout }: Props) => {
  const menuItems = [
    { id: 'contact', title: 'Nous contacter' },
    { id: 'faq', title: 'FAQ' },
    { id: 'about', title: 'À propos de nous' },
  ];

  const handleLogoutPress = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Se déconnecter", onPress: onLogout, style: "destructive" }
      ]
    );
  };

  return (
    <View style={styles.card}>
      {menuItems.map((item, index) => {
        // On affiche la bordure si ce n'est pas le dernier item OU si le bouton logout va suivre
        const showBorder = index < menuItems.length - 1 || isAuthenticated;

        return (
          <Pressable 
            key={item.id}
            style={({ pressed }) => [
              styles.item, 
              showBorder && styles.borderBottom,
              pressed && styles.pressedItem
            ]}
          >
            <Text style={styles.title}>{item.title}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
          </Pressable>
        );
      })}

      {/* Bouton de déconnexion conditionnel */}
      {isAuthenticated && (
        <Pressable 
          style={({ pressed }) => [styles.item, pressed && styles.pressedItem]} 
          onPress={handleLogoutPress}
        >
          <View style={styles.logoutContent}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
            <Text style={[styles.title, { color: colors.red }]}>Déconnexion</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: colors.dividerGrey, 
    overflow: 'hidden' 
  },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 18,
    backgroundColor: '#FFF'
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerGrey,
  },
  pressedItem: {
    backgroundColor: '#F8FAFC',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#1E293B' 
  },
});