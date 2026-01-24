import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, colors } from '../Themed';
import { UserDetailsFragment } from '../../saleor/api.generated';

interface Props {
  user: UserDetailsFragment | null;
}

export const UserProfile = ({ user }: Props) => {
  // On récupère les initiales (ex: "Jean Dupont" -> "JD")
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase();
  
  // Nettoyage de l'email virtuel pour afficher le téléphone si besoin
  const phoneNumber = user?.email?.split('@')[0] || '';

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials || '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userPhone}>{phoneNumber}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    padding: 5,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.red,
  },
  info: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  userPhone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
});