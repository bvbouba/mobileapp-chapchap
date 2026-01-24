import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Modal } from 'react-native';
import { Text, colors } from "../Themed";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";


export const LoginPrompt = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');

    const openModal = (type: 'login' | 'signup') => {
        setMode(type);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.subtitle}>
                Connectez-vous ou créez un compte pour accéder à vos tickets et à votre historique de voyage.
            </Text>

            <View style={styles.buttonContainer}>
                <Pressable style={styles.loginButton} onPress={() => openModal('login')}>
                    <Text style={styles.loginText}>Se connecter</Text>
                </Pressable>
                <Pressable style={styles.signUpButton} onPress={() => openModal('signup')}>
                    <Text style={styles.signUpText}>Créer un compte</Text>
                </Pressable>
            </View>

            <Modal 
                visible={modalVisible} 
                animationType="slide" 
                presentationStyle="fullScreen" // Donne un look "carte" sur iOS
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
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#FFFFFF' },
    subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 35 },
    buttonContainer: { width: '100%', gap: 12 },
    signUpButton: { backgroundColor: colors.red, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    signUpText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    loginButton: { backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: colors.red },
    loginText: { color: colors.red, fontSize: 16, fontWeight: '700' },
});