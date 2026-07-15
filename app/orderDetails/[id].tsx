import { Stack, usePathname, useRouter } from "expo-router";
import { StyleSheet, View, ScrollView, Pressable, Modal, StatusBar } from "react-native";
import { Text, colors, Divider } from "../../components/Themed";
import { useOrderContext } from "../../context/useOrderContext";
import { useEffect, useState } from "react";
import { OrderFragment } from "../../saleor/api.generated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TicketModalContent } from "../../components/orders/TicketModalContent";
import { getTripInformation } from "../../utils/attribute";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";

const OrderDetailsPage = () => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const [orderCache, setOrderCache] = useState<OrderFragment | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const { orders } = useOrderContext();

    useEffect(() => {
        const orderId = pathname.split("/").pop();
        const order = orders.find(o => o.id === orderId);
        setOrderCache(order);
        setLoading(false);
    }, [pathname, orders]);

    if (loading) return <View style={styles.centered}><Text>Chargement...</Text></View>;
    if (!orderCache) return <View style={styles.centered}><Text>Commande introuvable</Text></View>;

    const ticketLine = orderCache.lines.find(
        (line) => line.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG
    ) ?? orderCache.lines[0];

    const {
        departureCity, departureTimeStr, arrivalCity, arrivalTimeStr,
        formattedDate, departureStation, arrivalStation, company
    } = getTripInformation({ attributes: ticketLine?.variant?.attributes || [] });

    // Parsing des passagers depuis customerNote
    const passengers = orderCache.customerNote?.split(';').filter(p => p.trim() !== "") || [];

    return (
        <View style={{ flex: 1, backgroundColor: '#F1F1F1' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F1F1F1" />
            <Stack.Screen options={{ 
                headerShown: false,
            }} />

            <View style={[styles.topHeader, { paddingTop: insets.top + 12 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.green} />
                </Pressable>
                <View style={styles.headerTextBlock}>
                    <Text style={styles.headerTitle}>Voyage #{orderCache.number}</Text>
                    <Text style={styles.headerSubtitle}>Détails de votre réservation</Text>
                </View>
            </View>
            
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + Math.max(insets.bottom, 24) }]}
                showsVerticalScrollIndicator={false}
            >
                
                {/* 1. CARTE DE TRAJET (Visual Path) */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.companyName}>{company}</Text>
                        <View style={styles.dateBadge}>
                            <Text style={styles.dateText}>{formattedDate}</Text>
                        </View>
                    </View>

                    <View style={styles.tripRow}>
                        {/* Colonne Gauche: Heures */}
                        <View style={styles.timeCol}>
                            <Text style={styles.timeText}>{departureTimeStr}</Text>
                            <View style={styles.durationLine} />
                            <Text style={styles.timeText}>{arrivalTimeStr}</Text>
                        </View>

                        {/* Colonne Milieu: Indicateur Visuel */}
                        <View style={styles.indicatorCol}>
                            <View style={styles.dotFilled} />
                            <View style={styles.lineDashed} />
                            <MaterialCommunityIcons name="bus" size={20} color={colors.blue} style={{marginVertical: 4}} />
                            <View style={styles.lineDashed} />
                            <View style={styles.dotOutline} />
                        </View>

                        {/* Colonne Droite: Villes & Gares */}
                        <View style={styles.locationCol}>
                            <View>
                                <Text style={styles.cityText}>{departureCity}</Text>
                                <Text style={styles.stationText}>{departureStation}</Text>
                            </View>
                            <View style={{ marginTop: 'auto' }}>
                                <Text style={styles.cityText}>{arrivalCity}</Text>
                                <Text style={styles.stationText}>{arrivalStation}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 2. CARTE PASSAGERS */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Voyageurs ({passengers.length})</Text>
                    {passengers.map((p, i) => (
                        <View key={i} style={styles.passengerRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{p.split(',')[0]?.[0]}</Text>
                            </View>
                            <Text style={styles.passengerName}>{p.replace(',', ' ')}</Text>
                        </View>
                    ))}
                </View>

                {/* 3. CARTE PAIEMENT */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Détails du paiement</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Statut</Text>
                        <Text style={[styles.priceValue, { color: '#16A34A' }]}>{orderCache.status}</Text>
                    </View>
                    <Divider style={{ marginVertical: 10 }} />
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total réglé</Text>
                        <Text style={styles.totalValue}>
                            {orderCache.total.gross.amount} {orderCache.total.gross.currency}
                        </Text>
                    </View>
                </View>

                {/* BOUTON ACTION PRINCIPAL */}
                <Pressable style={styles.ticketButton} onPress={() => setModalVisible(true)}>
                    <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="white" />
                    <Text style={styles.ticketButtonText}>Afficher mon billet</Text>
                </Pressable>

            </ScrollView>

            {/* MODAL (Inchangé car déjà bien) */}
            <Modal animationType="slide" visible={isModalVisible} onRequestClose={() => setModalVisible(false)} statusBarTranslucent>
                <View style={styles.modalContainer}>
                    <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
                        <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={28} color="white" />
                        </Pressable>
                    </View>
                    <ScrollView contentContainerStyle={[styles.modalScroll, { paddingBottom: 40 + Math.max(insets.bottom, 20) }]}>
                        <TicketModalContent order={orderCache} />
                        <Text style={styles.modalFooterText}>Présentez ce code au chauffeur</Text>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topHeader: {
        backgroundColor: '#F1F1F1',
        paddingHorizontal: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#D7D8DB',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D7D8DB',
        marginRight: 12,
    },
    headerTextBlock: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'TTNormsPro-Bold',
        color: '#000000',
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: 'TTNormsPro-Regular',
        color: '#606060',
        marginTop: 2,
    },
    scrollContent: { padding: 16 },
    
    // Design des Cartes
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#D7D8DB',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    companyName: { fontSize: 14, fontFamily: 'TTNormsPro-Bold', color: '#000000', textTransform: 'uppercase', flex: 1, paddingRight: 10 },
    dateBadge: { backgroundColor: '#E6F5F3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
    dateText: { fontSize: 12, color: colors.green, fontFamily: 'TTNormsPro-Bold' },

    // Itinéraire Visuel
    tripRow: { flexDirection: 'row', height: 160 },
    timeCol: { justifyContent: 'space-between', alignItems: 'flex-end', width: 50 },
    timeText: { fontSize: 16, fontFamily: 'TTNormsPro-Bold', color: '#000000' },
    durationLine: { width: 1, flex: 1, backgroundColor: '#D7D8DB', marginRight: 10, marginVertical: 4 },
    
    indicatorCol: { alignItems: 'center', width: 40, marginHorizontal: 10 },
    dotFilled: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.green },
    dotOutline: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#EB1700' },
    lineDashed: { width: 2, flex: 1, backgroundColor: '#D7D8DB', borderRadius: 1 },

    locationCol: { flex: 1, justifyContent: 'space-between' },
    cityText: { fontSize: 17, fontFamily: 'TTNormsPro-Bold', color: '#000000' },
    stationText: { fontSize: 13, color: '#606060', fontFamily: 'TTNormsPro-Regular', marginTop: 2 },

    // Passagers
    sectionTitle: { fontSize: 15, fontFamily: 'TTNormsPro-Bold', color: '#606060', marginBottom: 15 },
    passengerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E6F5F3', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { fontSize: 14, fontFamily: 'TTNormsPro-Bold', color: colors.green },
    passengerName: { fontSize: 15, fontFamily: 'TTNormsPro-Regular', color: '#000000' },

    // Prix
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priceLabel: { color: '#606060', fontSize: 14, fontFamily: 'TTNormsPro-Regular' },
    priceValue: { fontFamily: 'TTNormsPro-Bold' },
    totalLabel: { fontSize: 16, fontFamily: 'TTNormsPro-Bold', color: '#000000' },
    totalValue: { fontSize: 18, fontFamily: 'TTNormsPro-Bold', color: colors.green },

    // Bouton
    ticketButton: {
        backgroundColor: colors.red,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 8,
        shadowColor: colors.red,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    ticketButtonText: { color: 'white', fontSize: 16, fontFamily: 'TTNormsPro-Bold', marginLeft: 10, textTransform: 'uppercase' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#111827' },
    modalHeader: { paddingHorizontal: 20, alignItems: 'flex-end' },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    modalScroll: { paddingBottom: 40, alignItems: 'center' },
    modalFooterText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 },
});

export default OrderDetailsPage;