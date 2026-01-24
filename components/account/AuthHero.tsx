import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, colors } from '../Themed';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const AuthHero = ({ onOpenAuth }: Props) => (
  <View style={styles.container}>
    <Pressable style={styles.loginBtn} onPress={() => onOpenAuth('login')}>
      <Text style={styles.loginBtnText}>Se connecter</Text>
    </Pressable>
    
    <Pressable style={styles.signupLink} onPress={() => onOpenAuth('signup')}>
      <Text style={styles.signupText}>
        Vous n'avez pas de compte ? <Text style={styles.link}>S'inscrire</Text>
      </Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 35 },
  loginBtn: {
    backgroundColor: colors.red,
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  signupLink: { marginTop: 15, padding: 5 },
  signupText: { color: '#64748B', fontSize: 14 },
  link: { color: colors.red, fontWeight: '800' },
});