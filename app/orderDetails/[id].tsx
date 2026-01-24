import { Link, Stack, usePathname, useLocalSearchParams } from "expo-router";
import { StyleSheet, View, ScrollView, Pressable, Modal } from "react-native";
import { Text, colors, Divider } from "../../components/Themed";
import { useOrderContext } from "../../context/useOrderContext";
import { useEffect, useState } from "react";
import { OrderFragment } from "../../saleor/api.generated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TicketModalContent } from "../../components/orders/TicketModalContent";
import { getTripInformation } from "../../utils/attribute";

const OrderDetailsPage = () => {
    const pathname = usePathname();
    const [orderCache, setOrderCache] = useState<OrderFragment | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const { orders } = useOrderContext();

    useEffect(() => {
        if (orders.length > 0) {
            const orderId = pathname.split("/").pop();
            const order = orders.find(o => o.id === orderId);
            setOrderCache(order);
            setLoading(false);
        }
    }, [pathname, orders]);

    if (loading) return <View style={styles.centered}><Text>Chargement...</Text></View>;
    if (!orderCache) return <View style={styles.centered}><Text>Commande introuvable</Text></View>;

    const {
        departureCity, departureTimeStr, arrivalCity, arrivalTimeStr,
        formattedDate, departureStation, arrivalStation, company
    } = getTripInformation({ attributes: orderCache.lines[0]?.variant?.attributes || [] });

    // Parsing des passagers depuis customerNote
    const passengers = orderCache.customerNote?.split(';').filter(p => p.trim() !== "") || [];

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <Stack.Screen options={{ 
                title: `Voyage #${orderCache.number}`,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#F8FAFC' }
            }} />
            
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
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
                    <MaterialCommunityIcons name="qrcode-scan" size={24} color="white" />
                    <Text style={styles.ticketButtonText}>Afficher mon billet</Text>
                </Pressable>

            </ScrollView>

            {/* MODAL (Inchangé car déjà bien) */}
            <Modal animationType="slide" visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={28} color="white" />
                        </Pressable>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalScroll}>
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
    scrollContent: { padding: 20 },
    
    // Design des Cartes
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    companyName: { fontSize: 16, fontWeight: '800', color: colors.blue, textTransform: 'uppercase' },
    dateBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    dateText: { fontSize: 12, color: colors.blue, fontWeight: '700' },

    // Itinéraire Visuel
    tripRow: { flexDirection: 'row', height: 160 },
    timeCol: { justifyContent: 'space-between', alignItems: 'flex-end', width: 50 },
    timeText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    durationLine: { width: 1, flex: 1, backgroundColor: '#E2E8F0', marginRight: 10, marginVertical: 4 },
    
    indicatorCol: { alignItems: 'center', width: 40, marginHorizontal: 10 },
    dotFilled: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.blue },
    dotOutline: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.red },
    lineDashed: { width: 2, flex: 1, backgroundColor: '#CBD5E1', borderRadius: 1 },

    locationCol: { flex: 1, justifyContent: 'space-between' },
    cityText: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
    stationText: { fontSize: 13, color: '#64748B', marginTop: 2 },

    // Passagers
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#64748B', marginBottom: 15 },
    passengerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { fontSize: 14, fontWeight: '700', color: colors.blue },
    passengerName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },

    // Prix
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priceLabel: { color: '#64748B', fontSize: 14 },
    priceValue: { fontWeight: '700' },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    totalValue: { fontSize: 18, fontWeight: '900', color: colors.blue },

    // Bouton
    ticketButton: {
        backgroundColor: colors.red,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        marginTop: 10,
        shadowColor: colors.red,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    ticketButtonText: { color: 'white', fontSize: 16, fontWeight: '800', marginLeft: 10, textTransform: 'uppercase' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#1E293B' },
    modalHeader: { paddingTop: 50, paddingHorizontal: 20, alignItems: 'flex-end' },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    modalScroll: { paddingBottom: 40, alignItems: 'center' },
    modalFooterText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 },
});

export default OrderDetailsPage;