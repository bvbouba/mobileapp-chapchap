import React, { useState, useRef } from "react";
import { StyleSheet, View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Text, colors } from "../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PhoneInput from "react-native-phone-number-input";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useSendCodeMutation, useUserRegisterMutation, useVerifyCodeMutation } from "../../saleor/api.generated";
import { useAuth } from "../../lib/providers/authProvider";
import { getConfig } from "../../config";
import { EllipsisLoader } from "../EllipsisLoader";

const appName = getConfig().appName;

interface Props {
    onClose: () => void;
    onSwitchToLogin: () => void;
}

export const SignupForm: React.FC<Props> = ({ onClose, onSwitchToLogin }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    // Form State
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Mutations
    const [sendCode] = useSendCodeMutation();
    const [verifyCode] = useVerifyCodeMutation();
    const [registerUser] = useUserRegisterMutation();

    const phoneInput = useRef<PhoneInput>(null);

    const handleSendOTP = async () => {
        if (!isValidPhoneNumber(phone)) {
            setError("Le numéro de téléphone n'est pas valide.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await sendCode({ variables: { phoneNumber: phone } });
            if (data?.sendOtp?.error) setError(data.sendOtp.error);
            else setStep(2);
        } catch (err) {
            setError("Erreur lors de l'envoi du code.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await verifyCode({ variables: { phoneNumber: phone, otp } });
            if (data?.verifyOtp?.error) setError(data.verifyOtp.error);
            else setStep(3);
        } catch (err) {
            setError("Code invalide.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const virtualEmail = `${phone}@chapchaptickets.com`;
            const { data } = await registerUser({
                variables: {
                    input: { email: virtualEmail, password, firstName, lastName }
                }
            });

            if (data?.accountRegister?.errors?.length) {
                setError(data.accountRegister.errors[0].message || "Erreur");
            } else {
                const success = await login({ email: virtualEmail, password });
                if (success) onClose();
            }
        } catch (err) {
            setError("L'inscription a échoué.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={26} color="#1E293B" />
                    </Pressable>
                    <Text style={styles.appName}>{appName}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.form}>
                    <Text style={styles.mainTitle}>Créer un compte</Text>
                    
                    {/* Indicateur d'étape discret */}
                    <View style={styles.stepIndicator}>
                        {[1, 2, 3].map(i => (
                            <View key={i} style={[styles.dot, step >= i && styles.activeDot]} />
                        ))}
                    </View>

                    {step === 1 && (
                        <>
                            <PhoneInput
                                ref={phoneInput}
                                defaultValue={phone}
                                defaultCode="CI"
                                layout="first"
                                onChangeFormattedText={setPhone}
                                containerStyle={styles.phoneInputContainer}
                                textContainerStyle={styles.phoneTextContainer}
                                textInputStyle={styles.phoneTextInput}
                                placeholder="Numéro de téléphone"
                            />
                            <Pressable style={[styles.submitBtn, !phone && styles.disabledBtn]} onPress={handleSendOTP} disabled={loading}>
                                {loading ? <EllipsisLoader color="#FFFFFF" dotSize={6} /> : <Text style={styles.submitBtnText}>Envoyer le code</Text>}
                            </Pressable>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <TextInput 
                                style={[styles.input, styles.otpInput]} 
                                maxLength={6} 
                                keyboardType="number-pad" 
                                placeholder="Code de vérification"
                                value={otp} 
                                onChangeText={setOtp} 
                                autoFocus
                            />
                            <Pressable style={styles.submitBtn} onPress={handleVerifyOTP} disabled={loading}>
                                {loading ? <EllipsisLoader color="#FFFFFF" dotSize={6} /> : <Text style={styles.submitBtnText}>Vérifier le code</Text>}
                            </Pressable>
                            <Pressable onPress={() => setStep(1)}><Text style={styles.retryText}>Changer de numéro</Text></Pressable>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <View style={styles.row}>
                                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Prénom" value={firstName} onChangeText={setFirstName} />
                                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Nom" value={lastName} onChangeText={setLastName} />
                            </View>
                            <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />
                            <TextInput style={styles.input} placeholder="Confirmer mot de passe" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                            <Pressable style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
                                {loading ? <EllipsisLoader color="#FFFFFF" dotSize={6} /> : <Text style={styles.submitBtnText}>Finaliser l'inscription</Text>}
                            </Pressable>
                        </>
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <Pressable onPress={onSwitchToLogin} style={styles.switchBtn}>
                        <Text style={styles.switchText}>Déjà un compte ? <Text style={styles.link}>Se connecter</Text></Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#fff', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 40 : 20, marginBottom: 20 },
    appName: { fontSize: 18, fontWeight: '700', color: '#64748B' },
    closeBtn: { padding: 4 },
    form: { gap: 15 },
    mainTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
    stepIndicator: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    dot: { width: 20, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
    activeDot: { backgroundColor: colors.red, width: 30 },
    phoneInputContainer: { width: '100%', height: 60, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden' },
    phoneTextContainer: { backgroundColor: 'transparent', paddingVertical: 0 },
    phoneTextInput: { fontSize: 16, color: '#1E293B', fontWeight: '500' },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', padding: 18, borderRadius: 12, fontSize: 16, color: '#1E293B', fontWeight: '500' },
    otpInput: { textAlign: 'center', letterSpacing: 4, fontSize: 20 },
    row: { flexDirection: 'row', gap: 10 },
    submitBtn: { backgroundColor: colors.red, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
    disabledBtn: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    errorContainer: { marginTop: 5, alignItems: 'center' },
    errorText: { color: colors.red, fontSize: 13, fontWeight: '600', textAlign: 'center' },
    retryText: { color: '#64748B', textAlign: 'center', fontSize: 13, fontWeight: '600', marginTop: 5 },
    switchBtn: { marginTop: 20, alignItems: 'center' },
    switchText: { color: '#64748B', fontSize: 14 },
    link: { color: colors.red, fontWeight: '800' }
});