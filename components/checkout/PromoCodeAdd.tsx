import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { View, Text } from "../Themed";
import { useCheckoutAddPromoCodeMutation, LanguageCodeEnum } from '../../checkout/graphql';
import { EllipsisLoader } from '../EllipsisLoader';

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
                    placeholderTextColor="#606060"
                />
                {promoCode.length > 0 && (
                    <TouchableOpacity 
                        style={styles.applyBtn} 
                        onPress={handleApply}
                        disabled={loading}
                    >
                        {loading ? (
                            <EllipsisLoader color="#EB1700" dotSize={5} />
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
        paddingVertical: 14,
        backgroundColor: "#FFFFFF",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F1F1",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D7D8DB",
        paddingHorizontal: 12,
        height: 50,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#000000",
        fontFamily: "TTNormsPro-Regular",
    },
    applyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    applyBtnText: {
        color: "#02838A",
        fontSize: 14,
        fontFamily: "TTNormsPro-Bold",
    },
});