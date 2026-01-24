import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaddedView, Text, colors } from '../Themed';
import { paymentMethodToComponent } from './payments/supportedPaymentApps';
import { usePayments } from './payments/usePayments';

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
                                <Ionicons name="arrow-back" size={24} color={colors.blue} />
                                <Text style={styles.backText}>Retour</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.title}>Paiement</Text>
                        )}
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close-circle" size={28} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        <PaddedView>
                            <View style={styles.amountBox}>
                                <Text style={styles.amountLabel}>Total à régler</Text>
                                <Text style={styles.amountValue}>{totalAmount}</Text>
                            </View>

                            {fetching ? (
                                <ActivityIndicator size="large" color={colors.blue} style={{ marginTop: 40 }} />
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
                                                        size={24} 
                                                        color={colors.blue} 
                                                    />
                                                </View>
                                                <Text style={styles.methodName}>
                                                    {gateway.id.includes('dummy') ? 'Passerelle de Test' : 'Carte Bancaire'}
                                                </Text>
                                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '55%' },
    indicator: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, alignSelf: 'center', marginTop: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, alignItems: 'center' },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    backText: { color: colors.blue, fontWeight: '700', fontSize: 16 },
    title: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    amountBox: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
    amountLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
    amountValue: { fontSize: 28, fontWeight: '900', color: colors.blue },
    subTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 12 },
    gatewaysList: { gap: 10 },
    methodItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 14, 
        backgroundColor: '#F1F5F9', 
        borderRadius: 16,
        gap: 12 
    },
    methodIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    methodName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1E293B' },
    selectedContainer: { marginTop: 10 },
    confirmTitle: { textAlign: 'center', fontSize: 14, color: '#64748B', marginBottom: 20 }
});