import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { View, Text, colors } from '../Themed';
import { useCheckoutAddPromoCodeMutation, LanguageCodeEnum } from '../../checkout/graphql';

interface PromoCodeAddProps {
    checkoutId: string;
    onSuccess?: () => void;
}

export const PromoCodeAdd: React.FC<PromoCodeAddProps> = ({ checkoutId, onSuccess }) => {
    const [promoCode, setPromoCode] = useState('');
    const [addPromoCode, { loading }] = useCheckoutAddPromoCodeMutation();

    const handleApply = async () => {
        if (!promoCode.trim()) return;

        try {
            const result = await addPromoCode({
                variables: {
                    checkoutId: checkoutId,
                    promoCode: promoCode.trim(),
                    languageCode: LanguageCodeEnum.Fr
                }
            });

            if (result.data?.checkoutAddPromoCode?.errors?.length) {
                const msg = result.data.checkoutAddPromoCode.errors[0].message;
                alert(msg || "Code invalide");
            } else {
                setPromoCode(''); // Reset input on success
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder="Carte-cadeau ou code promo"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                    placeholderTextColor="#94A3B8"
                />
                {promoCode.length > 0 && (
                    <TouchableOpacity 
                        style={styles.applyBtn} 
                        onPress={handleApply}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.blue} />
                        ) : (
                            <Text style={styles.applyBtnText}>Appliquer</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 50,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
    },
    applyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    applyBtnText: {
        color: colors.blue,
        fontWeight: 'bold',
        fontSize: 14,
    },
});