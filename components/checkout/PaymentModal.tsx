import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaddedView, Text } from "../Themed";
import { paymentMethodToComponent } from "./payments/supportedPaymentApps";
import { usePayments } from "./payments/usePayments";
import { EllipsisLoader } from "../EllipsisLoader";

export const PaymentModal = ({
    visible,
    onClose,
    totalAmount,
}: {
    visible: boolean;
    onClose: () => void;
    totalAmount: string;
}) => {
    const insets = useSafeAreaInsets();
    const { availablePaymentGateways, fetching } = usePayments();
    
    // Track which gateway is currently selected
    const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

    const handleClose = () => {
        setSelectedGatewayId(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="overFullScreen"
            transparent={false}
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={handleClose}
        >
            <View style={styles.screen}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    {selectedGatewayId ? (
                        <TouchableOpacity
                            onPress={() => setSelectedGatewayId(null)}
                            style={styles.headerIconBtn}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="arrow-back" size={22} color="#000000" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerSpacer} />
                    )}
                    <Text style={styles.headerTitle}>
                        {selectedGatewayId ? "Confirmer le paiement" : "Paiement"}
                    </Text>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={styles.headerIconBtn}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="close" size={24} color="#000000" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scroll}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: Math.max(insets.bottom, 16) + 24 },
                    ]}
                >
                    <View style={styles.sectionShell}>
                        <PaddedView style={styles.amountSection}>
                            <Text style={styles.amountLabel}>Total à régler</Text>
                            <Text style={styles.amountValue}>{totalAmount}</Text>
                        </PaddedView>
                    </View>

                    <View style={styles.sectionShell}>
                        <PaddedView style={styles.paymentSection}>
                            {fetching ? (
                                <View style={styles.loadingContainer}>
                                    <EllipsisLoader color="#EB1700" />
                                </View>
                            ) : selectedGatewayId ? (
                                <View style={styles.selectedContainer}>
                                    <Text style={styles.confirmTitle}>Choisissez comment finaliser votre paiement.</Text>
                                    {(() => {
                                        const Component = paymentMethodToComponent[selectedGatewayId];
                                        const gateway = availablePaymentGateways.find(
                                            (g) => g.id === selectedGatewayId
                                        );
                                        return <Component config={gateway} />;
                                    })()}
                                </View>
                            ) : (
                                <View style={styles.gatewaysList}>
                                    <Text style={styles.subTitle}>CHOISISSEZ VOTRE MODE DE PAIEMENT</Text>
                                    {availablePaymentGateways
                                        .filter((g) => g.id in paymentMethodToComponent)
                                        .map((gateway) => (
                                            <TouchableOpacity
                                                key={gateway.id}
                                                style={styles.methodItem}
                                                onPress={() => setSelectedGatewayId(gateway.id)}
                                                activeOpacity={0.85}
                                            >
                                                <View style={styles.methodIconBox}>
                                                    <Ionicons
                                                        name={
                                                            gateway.id.includes("dummy")
                                                                ? "flask-outline"
                                                                : "card-outline"
                                                        }
                                                        size={22}
                                                        color="#02838A"
                                                    />
                                                </View>
                                                <Text style={styles.methodName}>
                                                    {gateway.id.includes("dummy")
                                                        ? "Passerelle de Test"
                                                        : "Carte Bancaire"}
                                                </Text>
                                                <Ionicons name="chevron-forward" size={20} color="#D7D8DB" />
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            )}
                        </PaddedView>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F1F1F1" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#D7D8DB",
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 16,
        color: "#000000",
        fontFamily: "TTNormsPro-Bold",
    },
    headerSpacer: { width: 36 },
    scroll: { flex: 1, backgroundColor: "#F1F1F1" },
    scrollContent: { paddingTop: 12 },
    sectionShell: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#D7D8DB",
        overflow: "hidden",
    },
    amountSection: {
        alignItems: "center",
        paddingVertical: 20,
        backgroundColor: "#FFFFFF",
    },
    amountLabel: { fontSize: 12, color: "#606060", fontFamily: "TTNormsPro-Bold" },
    amountValue: { fontSize: 26, color: "#02838A", fontFamily: "TTNormsPro-Bold", marginTop: 4 },
    paymentSection: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 16,
    },
    loadingContainer: { marginTop: 20, marginBottom: 20, alignItems: "center" },
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
    selectedContainer: {},
    confirmTitle: {
        textAlign: "center",
        fontSize: 14,
        color: "#606060",
        marginBottom: 20,
        fontFamily: "TTNormsPro-Regular",
    },
});