import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaddedView, Text } from "../Themed";
import { paymentMethodToComponent } from './payments/supportedPaymentApps';
import { usePayments } from './payments/usePayments';
import { EllipsisLoader } from '../EllipsisLoader';

export const PaymentModal = ({ visible, onClose, totalAmount }: { visible: boolean, onClose: () => void, totalAmount: string }) => {
    const { availablePaymentGateways, fetching } = usePayments();
    
    // Track which gateway is currently selected
    const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

    const handleClose = () => {
        setSelectedGatewayId(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.indicator} />
                    
                    <View style={styles.header}>
                        {selectedGatewayId ? (
                            <TouchableOpacity onPress={() => setSelectedGatewayId(null)} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={22} color="#02838A" />
                                <Text style={styles.backText}>Retour</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.title}>Paiement</Text>
                        )}
                        <TouchableOpacity onPress={handleClose} hitSlop={12}>
                            <Ionicons name="close-circle" size={28} color="#D7D8DB" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        <PaddedView>
                            <View style={styles.amountBox}>
                                <Text style={styles.amountLabel}>Total à régler</Text>
                                <Text style={styles.amountValue}>{totalAmount}</Text>
                            </View>

                            {fetching ? (
                                <View style={{ marginTop: 40, alignItems: "center" }}>
                                    <EllipsisLoader color="#EB1700" />
                                </View>
                            ) : selectedGatewayId ? (
                                /* STEP 2: Show the selected Gateway Component (The Pay Button) */
                                <View style={styles.selectedContainer}>
                                    <Text style={styles.confirmTitle}>Confirmer le paiement</Text>
                                    {(() => {
                                        const Component = paymentMethodToComponent[selectedGatewayId];
                                        const gateway = availablePaymentGateways.find(g => g.id === selectedGatewayId);
                                        return <Component config={gateway} />;
                                    })()}
                                </View>
                            ) : (
                                /* STEP 1: Show the List of Methods */
                                <View style={styles.gatewaysList}>
                                    <Text style={styles.subTitle}>CHOISISSEZ VOTRE MODE DE PAIEMENT</Text>
                                    {availablePaymentGateways
                                        .filter(g => g.id in paymentMethodToComponent)
                                        .map((gateway) => (
                                            <TouchableOpacity 
                                                key={gateway.id} 
                                                style={styles.methodItem}
                                                onPress={() => setSelectedGatewayId(gateway.id)}
                                            >
                                                <View style={styles.methodIconBox}>
                                                    <Ionicons
                                                        name={gateway.id.includes('dummy') ? "flask-outline" : "card-outline"}
                                                        size={22}
                                                        color="#02838A"
                                                    />
                                                </View>
                                                <Text style={styles.methodName}>
                                                    {gateway.id.includes('dummy') ? 'Passerelle de Test' : 'Carte Bancaire'}
                                                </Text>
                                                <Ionicons name="chevron-forward" size={20} color="#D7D8DB" />
                                            </TouchableOpacity>
                                        ))
                                    }
                                </View>
                            )}
                        </PaddedView>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContainer: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "55%",
    },
    indicator: {
        width: 40,
        height: 5,
        backgroundColor: "#D7D8DB",
        borderRadius: 10,
        alignSelf: "center",
        marginTop: 12,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 16,
        alignItems: "center",
    },
    backButton: { flexDirection: "row", alignItems: "center", gap: 6 },
    backText: { color: "#02838A", fontSize: 16, fontFamily: "TTNormsPro-Bold" },
    title: { fontSize: 18, color: "#000000", fontFamily: "TTNormsPro-Bold" },
    amountBox: {
        backgroundColor: "#F1F1F1",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#D7D8DB",
    },
    amountLabel: { fontSize: 12, color: "#606060", fontFamily: "TTNormsPro-Bold" },
    amountValue: { fontSize: 26, color: "#02838A", fontFamily: "TTNormsPro-Bold", marginTop: 4 },
    subTitle: {
        fontSize: 11,
        color: "#606060",
        marginBottom: 12,
        fontFamily: "TTNormsPro-Bold",
        letterSpacing: 0.5,
    },
    gatewaysList: { gap: 10 },
    methodItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        backgroundColor: "#F1F1F1",
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: "#D7D8DB",
    },
    methodIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D7D8DB",
    },
    methodName: { flex: 1, fontSize: 15, color: "#000000", fontFamily: "TTNormsPro-Bold" },
    selectedContainer: { marginTop: 10 },
    confirmTitle: {
        textAlign: "center",
        fontSize: 14,
        color: "#606060",
        marginBottom: 20,
        fontFamily: "TTNormsPro-Regular",
    },
});