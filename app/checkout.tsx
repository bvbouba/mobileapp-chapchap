import React, { useState } from 'react';
import { 
    Alert, 
    SafeAreaView, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    Switch, 
    ActivityIndicator 
} from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PaymentModal } from '../components/checkout/PaymentModal';

// UI Components
import { PaddedView, Text, View, colors } from '../components/Themed';
import { Button } from 'react-native-paper';
import { Summary } from '../components/checkout/Summary';
import { PromoCodeAdd } from '../components/checkout/PromoCodeAdd';
import { ContactSection } from '../components/checkout/ContactSection';
import { PassengerSection } from '../components/checkout/PassengerSection';

// Contexts & Hooks
import { useCheckout } from '../context/useCheckout';
import { getConfig } from '../config';
import { useGuestUserForm } from '../checkout/hooks/useGuestUserForm';

const Checkout = () => {
    const router = useRouter();
    
    // 1. Data Fetching
    const { checkout, fetching: fetchingCheckout, refetch } = useCheckout();

    // 2. Form Logic - Opens modal only after successful data sync
    const { 
        phone, 
        setPhone, 
        passengers, 
        setPassengers, 
        handleSubmit, 
        loading: isUpdating 
    } = useGuestUserForm(checkout, () => {
        setPaymentModalVisible(true);
    });

    // 3. UI State
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);

    const totalAmount = checkout?.totalPrice?.gross?.amount ?? 0;
    const currency = checkout?.totalPrice?.gross?.currency ?? "XOF";

    // --- Loading & Empty States ---
    if (fetchingCheckout && !checkout) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.blue} />
                <Text style={{ marginTop: 10 }}>Chargement de votre commande...</Text>
            </View>
        );
    }

    if (!checkout || checkout.lines.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Votre panier est vide</Text>
                <Button 
                    onPress={() => router.push("/")} 
                    mode="contained" 
                    style={{ marginTop: 20 }}
                >
                    Retour à l'accueil
                </Button>
            </View>
        );
    }

    // --- Final Submission ---
    const handleContinueToPayment = () => {
        if (!acceptedTerms) {
            Alert.alert("Conditions", "Veuillez accepter les conditions générales.");
            return;
        }

        if (!phone || phone.length < 8) {
            Alert.alert("Contact", "Veuillez entrer un numéro de téléphone valide.");
            return;
        }

        const incomplete = passengers.some(p => !p.firstName.trim() || !p.lastName.trim());
        if (incomplete) {
            Alert.alert("Passagers", "Veuillez remplir les noms de tous les passagers.");
            return;
        }

        // Saves user data, then triggers the callback to open the modal
        handleSubmit();
    };

    return (
        <StripeProvider publishableKey={getConfig().stripePK}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Validation Commande</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Summary 
                        lines={checkout.lines} 
                        totalPrice={checkout.totalPrice} 
                        editable={false} 
                        voucherCode={checkout.voucherCode}
                        giftCards={[]} 
                        shippingPrice={null}
                    />

                    <PromoCodeAdd checkoutId={checkout.id} onSuccess={refetch} />

                    <ContactSection phone={phone} setPhone={setPhone} />

                    <PassengerSection 
                        passengers={passengers} 
                        setPassengers={setPassengers} 
                    />

                    <PaddedView style={styles.footerSection}>
                        <View style={styles.termsToggleContainer}>
                            <TouchableOpacity 
                                style={styles.termsHeader} 
                                onPress={() => setTermsOpen(!termsOpen)}
                            >
                                <Text style={styles.termsHeaderText}>Conditions de vente</Text>
                                <Ionicons name={termsOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.red} />
                            </TouchableOpacity>
                            
                            {termsOpen && (
                                <View style={styles.termsContentBox}>
                                    <Text style={styles.termsText}>
                                        Toutes les réservations sont soumises aux conditions de vente. 
                                        Billets non remboursables et non échangeables.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.checkboxRow}>
                            <Switch 
                                value={acceptedTerms} 
                                onValueChange={setAcceptedTerms}
                                trackColor={{ false: "#CBD5E1", true: colors.blue }}
                            />
                            <Text style={styles.checkboxLabel}>J'accepte les conditions générales.</Text>
                        </View>

                        <Button 
                            mode="contained" 
                            onPress={handleContinueToPayment}
                            loading={isUpdating}
                            disabled={!acceptedTerms || isUpdating}
                            style={styles.payButton}
                        >
                            CONTINUER VERS LE PAIEMENT
                        </Button>
                    </PaddedView>
                </ScrollView>

                <PaymentModal 
                    visible={isPaymentModalVisible}
                    onClose={() => setPaymentModalVisible(false)}
                    totalAmount={`${totalAmount} ${currency}`}
                />
            </SafeAreaView>
        </StripeProvider>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 15,
        backgroundColor: 'white', 
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    headerTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase' },
    footerSection: { paddingVertical: 24, paddingBottom: 60, backgroundColor: 'white' },
    termsToggleContainer: { marginBottom: 20 },
    termsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
    termsHeaderText: { color: colors.red, fontWeight: '600', fontSize: 14 },
    termsContentBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginTop: 10 },
    termsText: { fontSize: 12, color: '#64748B', lineHeight: 18 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 12 },
    checkboxLabel: { flex: 1, fontSize: 14, color: '#1E293B' },
    payButton: { backgroundColor: colors.red, borderRadius: 12, elevation: 0 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 15 }
});

export default Checkout;