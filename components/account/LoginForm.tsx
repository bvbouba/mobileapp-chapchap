import React, { useState, useRef } from "react";
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Text, colors } from "../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useAuth } from "../../lib/providers/authProvider";
import PhoneInput from "react-native-phone-number-input";
import { getConfig } from "../../config";

const appName = getConfig().appName;

interface Props {
    onClose: () => void;
    onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<Props> = ({ onClose, onSwitchToSignup }) => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);
    const phoneInput = useRef<PhoneInput>(null);
    const { login, error: authError, loading: authLoading } = useAuth();

    const handleLogin = async () => {
        if (!isValidPhoneNumber(phoneNumber)) {
            setLocalError("Le numéro de téléphone n'est pas valide.");
            return;
        }
        if (!password) {
            setLocalError("Veuillez saisir votre mot de passe.");
            return;
        }

        setLocalError(null);
        try {
            const virtualEmail = `${phoneNumber}@chapchaptickets.com`;
            const res = await login({ email: virtualEmail, password: password });
            if (res) onClose();
        } catch (err) {
            setLocalError("Une erreur est survenue lors de la connexion.");
        }
    };

    const displayError = localError || authError;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={26} color="#1E293B" />
                    </Pressable>
                    <Text style={styles.appName}>{appName}</Text>
                    <View style={{width: 40}} />
                </View>

                <View style={styles.form}>
                    <Text style={styles.mainTitle}>Se connecter</Text>
                    
                    {/* Phone Input sans label externe */}
                    <PhoneInput
                        ref={phoneInput}
                        defaultValue={phoneNumber}
                        defaultCode="CI"
                        layout="first"
                        onChangeFormattedText={(text) => {
                            setPhoneNumber(text);
                            if (localError) setLocalError(null);
                        }}
                        containerStyle={styles.phoneInputContainer}
                        textContainerStyle={styles.phoneTextContainer}
                        textInputStyle={styles.phoneTextInput}
                        codeTextStyle={styles.phoneCodeText}
                        countryPickerProps={{ countryCodes: ["CI", "CA"], translation: "fra" }}
                        placeholder="Numéro de téléphone" // Le label est ici
                    />

                    {/* Password Input avec placeholder servant de label */}
                    <TextInput 
                        style={styles.input}
                        placeholder="Mot de passe"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (localError) setLocalError(null);
                        }}
                    />

                    <Pressable 
                        style={[styles.submitBtn, authLoading && styles.disabledBtn]} 
                        onPress={handleLogin} 
                        disabled={authLoading}
                    >
                        {authLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Se connecter</Text>
                        )}
                    </Pressable>

                    {/* Erreur épurée juste sous le bouton */}
                    {displayError && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{displayError}</Text>
                        </View>
                    )}

                    <Pressable onPress={onSwitchToSignup} style={styles.switchBtn}>
                        <Text style={styles.switchText}>
                            Vous n'avez pas de compte ? <Text style={styles.link}>S'inscrire</Text>
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#fff', padding: 20 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: Platform.OS === 'ios' ? 40 : 20, 
        marginBottom: 30 
    },
    appName: { fontSize: 18, fontWeight: '700', color: '#64748B' },
    closeBtn: { padding: 4 },
    form: { gap: 15 },
    mainTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 10 },
    
    phoneInputContainer: {
        width: '100%',
        height: 60,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        overflow: 'hidden'
    },
    phoneTextContainer: { backgroundColor: 'transparent', paddingVertical: 0 },
    phoneTextInput: { fontSize: 16, color: '#1E293B', fontWeight: '500' },
    phoneCodeText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },

    input: { 
        backgroundColor: '#F8FAFC', 
        borderWidth: 1.5, 
        borderColor: '#E2E8F0', 
        padding: 18, 
        borderRadius: 12, 
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500'
    },
    
    submitBtn: { 
        backgroundColor: colors.red, 
        padding: 18, 
        borderRadius: 12, 
        alignItems: 'center', 
        marginTop: 10,
        shadowColor: colors.red,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3
    },
    disabledBtn: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    errorContainer: {
        marginTop: 5,
        alignItems: 'center',
    },
    errorText: { 
        color: colors.red, 
        fontSize: 13, 
        fontWeight: '600',
        textAlign: 'center'
    },

    switchBtn: { marginTop: 20, alignItems: 'center' },
    switchText: { color: '#64748B', fontSize: 14 },
    link: { color: colors.red, fontWeight: '800' }
});