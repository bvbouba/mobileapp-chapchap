import { FC, useState, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View, Pressable, Dimensions, StatusBar } from "react-native";
import { useOrderContext } from "../../context/useOrderContext";
import { OrderFragment } from "../../saleor/api.generated";
import { Text, colors } from "../Themed";
import OrderListItem from "./OrderListItem";
import { getTripInformation } from "../../utils/attribute";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoginPrompt } from "../account/LoginPrompt";
import { useAuth } from "../../lib/providers/authProvider";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabType = 'upcoming' | 'past';

const OrdersList: FC = () => {
    const { orders } = useOrderContext();
    const { authenticated } = useAuth();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const scrollRef = useRef<FlatList>(null);
    const now = new Date();

    const getTravelDate = (order: OrderFragment): Date => {
        const ticketLine = order.lines.find(
            (line) => line.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG
        ) ?? order.lines[0];
        const attributes = ticketLine?.variant?.attributes || [];
        const { departureDate } = getTripInformation({ attributes });
        return departureDate || new Date(order.created);
    };

    const { upcomingOrders, pastOrders } = useMemo(() => {
        const upcoming = orders.filter(o => getTravelDate(o) >= now).sort((a, b) => getTravelDate(a).getTime() - getTravelDate(b).getTime());
        const past = orders.filter(o => getTravelDate(o) < now).sort((a, b) => getTravelDate(b).getTime() - getTravelDate(a).getTime());
        return { upcomingOrders: upcoming, pastOrders: past };
    }, [orders]);

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
                <MaterialCommunityIcons name="ticket-confirmation-outline" size={38} color="#02838A" />
            </View>
            <Text style={styles.emptyTitle}>Aucun voyage</Text>
            <Text style={styles.emptySubtitle}>
                {type === 'upcoming' ? "Vous n'avez pas de voyages prévus." : "Votre historique de voyage est vide."}
            </Text>
            {!authenticated && (
                <Text style={styles.guestHint}>Connectez-vous pour synchroniser vos voyages sur tous vos appareils.</Text>
            )}
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F1F1F1" />
            <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
                <Text style={styles.title}>Mes voyages</Text>
                <Text style={styles.subtitle}>
                    Retrouvez vos trajets à venir et vos anciennes réservations.
                </Text>
            </View>

            {!authenticated && orders.length === 0 ? (
                <View style={styles.loginPromptWrapper}>
                    <LoginPrompt />
                </View>
            ) : null}

            <View style={styles.tabsWrapper}>
                <Pressable onPress={() => handleTabPress('upcoming')} style={[styles.tabButton, activeTab === 'upcoming' && styles.activeTabButton]}>
                    <Text style={[styles.tabText, activeTab === 'upcoming' ? styles.activeTabText : styles.inactiveTabText]}>
                        À venir {upcomingOrders.length > 0 ? `(${upcomingOrders.length})` : ''}
                    </Text>
                </Pressable>

                <Pressable onPress={() => handleTabPress('past')} style={[styles.tabButton, activeTab === 'past' && styles.activeTabButton]}>
                    <Text style={[styles.tabText, activeTab === 'past' ? styles.activeTabText : styles.inactiveTabText]}>Historique</Text>
                </Pressable>
            </View>

            <FlatList
                ref={scrollRef}
                data={[upcomingOrders, pastOrders]}
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
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, 
        backgroundColor: "#F1F1F1" 
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 14,
    },
    title: {
        fontSize: 28,
        color: "#000000",
        fontFamily: "TTNormsPro-Bold",
    },
    subtitle: {
        fontSize: 14,
        color: "#606060",
        fontFamily: "TTNormsPro-Regular",
        marginTop: 6,
        lineHeight: 20,
    },
    loginPromptWrapper: {
        marginHorizontal: 16,
        marginBottom: 12,
        overflow: "hidden",
        borderRadius: 16,
    },
    tabsWrapper: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 14,
        padding: 4,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#D7D8DB",
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTabButton: { backgroundColor: colors.red },
    tabText: { fontSize: 13, fontFamily: 'TTNormsPro-Bold', textTransform: 'uppercase' },
    activeTabText: { color: "#FFFFFF" },
    inactiveTabText: { color: '#606060' },
    listContent: { paddingBottom: 40 },
    emptyContainer: {
        marginHorizontal: 16,
        minHeight: 320,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#D7D8DB",
    },
    emptyIconCircle: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: '#E6F5F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    emptyTitle: { fontSize: 20, fontFamily: 'TTNormsPro-Bold', color: '#000000', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#606060', fontFamily: 'TTNormsPro-Regular', textAlign: 'center', lineHeight: 20 },
    guestHint: { fontSize: 13, color: '#02838A', fontFamily: 'TTNormsPro-Bold', textAlign: 'center', marginTop: 14, lineHeight: 19 },
});

export default OrdersList;