import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import { useOrder } from "../checkout/hooks/useOrder";
import { Summary } from "../components/checkout/Summary";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { generateShortCode } from "../utils/generateShortCode";

const OrderConfirmation = () => {
    const { order } = useOrder();
    if (!order) return null;

    const confirmationCode = generateShortCode(order.id);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>

                {/* Section statut */}
                <View style={styles.successSection}>
            
                    <Text style={styles.successTitle}>Commande envoyée !</Text>
                    <Text style={styles.successSubtitle}>
                        Nous attendons la confirmation de la compagnie de transport...
                    </Text>
                </View>

                {/* Bloc Numéro de Confirmation Réagencé */}
                <View style={styles.confirmationBox}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain" 
                    />
                    <View style={styles.textCenter}>
                        <Text style={styles.confirmationLabel}>Numéro de confirmation</Text>
                        <Text style={styles.confirmationNumber}>{confirmationCode}</Text>
                    </View>
                </View>

                <Summary
                    voucherCode={order?.voucher?.code}
                    totalPrice={order?.total}
                    editable={false}
                    lines={order.lines}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    content: { padding: 20 },

    successSection: {
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#F97316",
        alignItems: "center",
        justifyContent: "center",
    },
    pulseRing: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#FFEDD5",
        borderWidth: 10,
        borderColor: "#FED7AA",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1E293B",
        marginBottom: 4,
    },
    successSubtitle: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
    },

    // Bloc Confirmation centré verticalement
    confirmationBox: {
        flexDirection: "column", // Aligne le logo au dessus
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#F1F5F9",
        borderRadius: 12,
        paddingVertical: 24,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    logo: {
        width: 140,
        height: 50, // Hauteur fixe pour éviter le "cut"
        marginBottom: 16, // Espace entre le logo et le texte
    },
    textCenter: {
        alignItems: "center",
    },
    confirmationLabel: {
        fontSize: 12,
        color: "#64748B",
        fontWeight: "600",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    confirmationNumber: {
        fontSize: 32, // Un peu plus grand pour l'impact
        fontWeight: "900",
        color: "#1E293B",
        letterSpacing: 2,
    },

    separator: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 20,
    },

    statusBox: {
        backgroundColor: "#FFF7ED",
        borderWidth: 1,
        borderColor: "#FED7AA",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    statusHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    statusTitle: {
        color: "#9A3412",
        fontWeight: "700",
        fontSize: 14,
    },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        backgroundColor: "#FED7AA",
        overflow: "hidden",
        marginBottom: 12,
    },
    progressFill: {
        width: "62%",
        height: "100%",
        borderRadius: 999,
        backgroundColor: "#F97316",
    },
    statusText: {
        color: "#9A3412",
        fontWeight: "600",
        fontSize: 13,
        lineHeight: 18
    },
});

export default OrderConfirmation;