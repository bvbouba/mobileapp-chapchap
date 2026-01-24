import { FC, useState, useMemo, useRef, useEffect } from "react";
import { FlatList, StyleSheet, View, Pressable, Dimensions } from "react-native";
import { useOrderContext } from "../../context/useOrderContext";
import { OrderFragment } from "../../saleor/api.generated";
import { Text, colors } from "../Themed";
import OrderListItem from "./OrderListItem";
import { getTripInformation } from "../../utils/attribute";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoginPrompt } from "../account/LoginPrompt";
import { useAuth } from "../../lib/providers/authProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabType = 'upcoming' | 'past';

const OrdersList: FC = () => {
    const { orders } = useOrderContext();
    const { authenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const scrollRef = useRef<FlatList>(null);
    const now = new Date();

    const getTravelDate = (order: OrderFragment): Date => {
        const attributes = order.lines[0]?.variant?.attributes || [];
        const { departureDate } = getTripInformation({ attributes });
        return departureDate || new Date(order.created);
    };

    const { upcomingOrders, pastOrders } = useMemo(() => {
        if (!authenticated) return { upcomingOrders: [], pastOrders: [] };
        const upcoming = orders.filter(o => getTravelDate(o) >= now).sort((a, b) => getTravelDate(a).getTime() - getTravelDate(b).getTime());
        const past = orders.filter(o => getTravelDate(o) < now).sort((a, b) => getTravelDate(b).getTime() - getTravelDate(a).getTime());
        return { upcomingOrders: upcoming, pastOrders: past };
    }, [orders, authenticated]);

    // Fonction pour changer d'onglet avec animation
    const handleTabPress = (tab: TabType) => {
        setActiveTab(tab);
        scrollRef.current?.scrollToIndex({
            index: tab === 'upcoming' ? 0 : 1,
            animated: true
        });
    };

    // Synchroniser l'onglet si l'utilisateur swipe manuellement
    const onMomentumScrollEnd = (e: any) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setActiveTab(index === 0 ? 'upcoming' : 'past');
    };

    const renderEmptyState = (type: TabType) => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="ticket-outline" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Aucun voyage</Text>
            <Text style={styles.emptySubtitle}>
                {type === 'upcoming' ? "Vous n'avez pas de voyages prévus." : "Votre historique de voyage est vide."}
            </Text>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            {/* TABS SELECTOR */}
            <View style={styles.tabsWrapper}>
                <Pressable onPress={() => handleTabPress('upcoming')} style={[styles.tabButton, activeTab === 'upcoming' && styles.activeTabButton]}>
                    <Text style={[styles.tabText, activeTab === 'upcoming' ? styles.activeTabText : styles.inactiveTabText]}>
                        À venir {authenticated && upcomingOrders.length > 0 ? `(${upcomingOrders.length})` : ''}
                    </Text>
                </Pressable>

                <Pressable onPress={() => handleTabPress('past')} style={[styles.tabButton, activeTab === 'past' && styles.activeTabButton]}>
                    <Text style={[styles.tabText, activeTab === 'past' ? styles.activeTabText : styles.inactiveTabText]}>Historique</Text>
                </Pressable>
            </View>

            {!authenticated ? (
                <LoginPrompt />
            ) : (
                <FlatList
                    ref={scrollRef}
                    data={[upcomingOrders, pastOrders]} // On passe les deux tableaux
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                    renderItem={({ item, index }) => (
                        <View style={{ width: SCREEN_WIDTH }}>
                            <FlatList
                                data={item}
                                keyExtractor={(order) => order.id}
                                renderItem={({ item: order }) => <OrderListItem order={order} />}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={() => renderEmptyState(index === 0 ? 'upcoming' : 'past')}
                            />
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
    tabsWrapper: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTabButton: { borderBottomColor: colors.red },
    tabText: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
    activeTabText: { color: colors.red },
    inactiveTabText: { color: '#1E293B', opacity: 0.5 },
    listContent: { paddingVertical: 16, paddingBottom: 40 },
    emptyContainer: { width: SCREEN_WIDTH, flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});

export default OrdersList;