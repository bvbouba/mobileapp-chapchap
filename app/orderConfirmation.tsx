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

                {/* Section Succès */}
                <View style={styles.successSection}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="check" size={30} color="white" />
                    </View>
                    <Text style={styles.successTitle}>Commande confirmée !</Text>
                    <Text style={styles.successSubtitle}>
                        Votre confirmation SMS/Email est en route !
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

                <View style={styles.separator} />

                {/* ALERTE : IMPRESSION OBLIGATOIRE */}
                <View style={styles.warningBox}>
                    <MaterialCommunityIcons name="printer-alert" size={20} color="#991B1B" style={{ marginRight: 8 }} />
                    <Text style={styles.warningTitle}>
                        Assurez-vous d'imprimer votre billet ou de le récupérer au guichet de la gare.
                    </Text>
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
        backgroundColor: "#22C55E",
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

    warningBox: {
        flexDirection: "row",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FCA5A5",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: "center"
    },
    warningTitle: {
        flex: 1,
        color: "#991B1B",
        fontWeight: "700",
        fontSize: 13,
        lineHeight: 18
    },
});

export default OrderConfirmation;