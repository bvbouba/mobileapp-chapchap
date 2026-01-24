import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Modal, Platform } from 'react-native';
import { AuthHero } from '../../components/account/AuthHero';
import { UserProfile } from '../../components/account/UserProfile'; // Nouveau
import { AccountMenu } from '../../components/account/AccountMenu';
import { AccountFooter } from '../../components/account/AccountFooter';
import { LoginForm } from '../../components/account/LoginForm';
import { SignupForm } from '../../components/account/SignupForm';
import { useAuth } from '../../lib/providers/authProvider';

export default function AccountScreen() {
  const { authenticated, user, logout } = useAuth(); // On récupère aussi logout
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const openAuth = (authMode: 'login' | 'signup') => {
    setMode(authMode);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Logique conditionnelle pour le Header */}
        {authenticated ? (
          <UserProfile user={user} />
        ) : (
          <AuthHero onOpenAuth={openAuth} />
        )}
        
        {/* Le menu reste visible, mais on pourra y ajouter "Déconnexion" si auth */}
        <AccountMenu isAuthenticated={authenticated} onLogout={logout} />

        <AccountFooter />

      </ScrollView>

      <Modal 
          visible={modalVisible} 
          animationType="slide" 
          presentationStyle="fullScreen"
          onRequestClose={() => setModalVisible(false)}
      >
          {mode === 'login' ? (
              <LoginForm 
                  onClose={() => setModalVisible(false)} 
                  onSwitchToSignup={() => setMode('signup')} 
              />
          ) : (
              <SignupForm 
                  onClose={() => setModalVisible(false)} 
                  onSwitchToLogin={() => setMode('login')} 
              />
          )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 40,
  }
});