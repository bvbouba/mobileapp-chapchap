import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useTransactionInitializeMutation } from '../../../../checkout/graphql';
import { useCheckout } from '../../../../context/useCheckout';
import { colors } from '../../../Themed';
import { useCheckoutComplete } from '../../../../checkout/hooks/useCheckoutComplete';
import { dummyGatewayId } from './types';
import { TransactionFlowStrategyEnum } from '../../../../checkout/graphql';

export const DummyComponent = () => {
    const { checkout } = useCheckout();
    const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();

    const [transactionInitialize, transactionResult] = useTransactionInitializeMutation();
    const isInProgress = transactionResult.loading || completingCheckout;

    const onInitializeClick = async () => {
        if (!checkout?.id) {
            Alert.alert("Erreur", "Session de commande introuvable.");
            return;
        }

        try {
            // 1. Initialize the transaction
            const { data } = await transactionInitialize({
                variables: {
                    checkoutId: checkout.id,
                    action: TransactionFlowStrategyEnum.Authorization,
                    paymentGateway: {
                        id: dummyGatewayId, 
                        data: {
                            "event": {
                                "includePspReference": true,
                                "type": "AUTHORIZATION_SUCCESS"
                            }
                        },
                    },
                }
            });

            // Handle API level errors (e.g., gateway down)
            if (data?.transactionInitialize?.errors && data.transactionInitialize.errors.length > 0) {
                Alert.alert("Paiement refusé", data.transactionInitialize.errors[0].message || "");
                return;
            }
            console.log(data)
            // 2. Transaction successful, finalize the order
            const result = await onCheckoutComplete();

            // Handle checkout completion errors
            if (result?.apiErrors) {
                Alert.alert("Commande échouée", result.apiErrors[0].message);
            }
            
            // Note: If result.data.order exists, useCheckoutComplete already 
            // handles the router.replace to the success screen.
            
        } catch (err) {
            console.error("Dummy Payment Exception:", err);
            Alert.alert("Erreur Système", "Impossible de traiter la transaction.");
        }
    };

    return (
        <Button 
            mode="contained" 
            onPress={onInitializeClick}
            loading={isInProgress}
            disabled={isInProgress}
            style={styles.button}
            contentStyle={styles.content}
            labelStyle={styles.label}
        >
            {isInProgress ? "TRAITEMENT..." : "CONFIRMER ET PAYER"}
        </Button>
    );
};

const styles = StyleSheet.create({
    button: { 
        backgroundColor: colors.blue, 
        borderRadius: 12, 
        marginTop: 10,
        elevation: 0 // Cleaner look on Android
    },
    content: { 
        height: 54, // Slightly taller for better touch target
    },
    label: {
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.5
    }
});