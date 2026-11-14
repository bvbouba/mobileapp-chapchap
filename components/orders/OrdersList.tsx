import { FC, useCallback, useMemo, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useOrderContext } from "../../context/useOrderContext";
import { OrderFragment } from "../../saleor/api.generated";
import { Text, colors } from "../Themed";
import OrderListItem from "./OrderListItem";
import { getTripInformation } from "../../utils/attribute";
import { LoginPrompt } from "../account/LoginPrompt";
import { useAuth } from "../../lib/providers/authProvider";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";
import {
  isTripInHistorique,
  readTripDelayMeta,
  readTripStatus,
} from "../../lib/tripStatus";
import { useDeviceLayout } from "../../lib/layout/deviceLayout";
import { TabletContentShell } from "../layout/TabletSplitView";

type TabType = "upcoming" | "past";

function ticketLineOf(order: OrderFragment) {
  return (
    order.lines.find(
      (line) =>
        !!line.variant && line.variant.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG,
    ) ?? null
  );
}

/** Drop orders whose trip variant was deleted / never resolved. */
function hasTicketVariant(order: OrderFragment): boolean {
  return ticketLineOf(order)?.variant != null;
}

function getTravelDate(order: OrderFragment): Date {
  const attributes = ticketLineOf(order)?.variant?.attributes || [];
  const { departureDate } = getTripInformation({ attributes });
  return departureDate || new Date(order.created);
}

function isOrderHistorique(order: OrderFragment, now: Date): boolean {
  const line = ticketLineOf(order);
  const attributes = line?.variant?.attributes || [];
  const metadata = line?.variant?.metadata ?? [];
  const { departureDate, durationMinutes } = getTripInformation({ attributes });
  const delay = readTripDelayMeta(metadata);
  return isTripInHistorique({
    tripStatus: readTripStatus(metadata),
    scheduledDeparture: departureDate,
    durationMinutes,
    isDelayed: delay.isDelayed,
    estimatedDepartureHm: delay.estimatedDeparture,
    orderStatus: order.status,
    orderMetadata: order.metadata,
    fulfillments: order.fulfillments,
    now,
  });
}

const OrdersList: FC = () => {
  const { orders, syncMyOrders, syncing, refreshOrders } = useOrderContext();
  const { authenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { useTabletLayout, horizontalGutter } = useDeviceLayout();
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof FlatList>>(null);

  const { upcomingOrders, pastOrders } = useMemo(() => {
    const now = new Date();
    const withVariant = orders.filter(hasTicketVariant);
    const upcoming = withVariant
      .filter((o) => !isOrderHistorique(o, now))
      .sort((a, b) => getTravelDate(a).getTime() - getTravelDate(b).getTime());
    const past = withVariant
      .filter((o) => isOrderHistorique(o, now))
      .sort((a, b) => getTravelDate(b).getTime() - getTravelDate(a).getTime());
    return { upcomingOrders: upcoming, pastOrders: past };
  }, [orders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setRefreshing(false);
    }
  }, [refreshOrders]);

  const listRefreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      tintColor={colors.green}
      colors={[colors.green]}
    />
  );

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    scrollRef.current?.scrollToIndex({
      index: tab === "upcoming" ? 0 : 1,
      animated: true,
    });
  };

  const onMomentumScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveTab(index === 0 ? "upcoming" : "past");
  };

  const onSyncPress = async () => {
    const result = await syncMyOrders();
    if (!result.ok) {
      Alert.alert("Synchronisation", result.message || "Impossible de synchroniser.");
      return;
    }
    if (result.linkedCount > 0) {
      Alert.alert(
        "Voyages synchronisés",
        `${result.linkedCount} billet${result.linkedCount > 1 ? "s" : ""} lié${result.linkedCount > 1 ? "s" : ""} à votre compte.`,
      );
    } else {
      Alert.alert(
        "Aucun nouveau billet",
        "Nous n'avons trouvé aucun billet guichet à lier à votre numéro.",
      );
    }
  };

  const renderEmptyState = (type: TabType) => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="ticket-confirmation-outline" size={38} color={colors.green} />
      </View>
      <Text style={styles.emptyTitle}>Aucun voyage</Text>
      <Text style={styles.emptySubtitle}>
        {type === "upcoming"
          ? "Vous n'avez pas de voyages prévus."
          : "Votre historique de voyage est vide."}
      </Text>
      {authenticated ? (
        <Pressable
          style={({ pressed }) => [
            styles.syncBtn,
            (syncing || pressed) && { opacity: 0.9 },
          ]}
          onPress={() => void onSyncPress()}
          disabled={syncing}
          accessibilityLabel="Synchroniser mes voyages"
        >
          {syncing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="cellphone-message" size={20} color="#FFFFFF" />
              <Text style={styles.syncBtnText}>Synchroniser mes voyages</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F1F1" />
      <TabletContentShell constrain={false} style={styles.shellFlush}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 18 },
          useTabletLayout && { paddingHorizontal: horizontalGutter },
        ]}
      >
        <Text style={styles.title}>Mes Voyages</Text>
        <Text style={styles.subtitle}>
          Retrouvez tous vos billets de car — à venir et historique.
        </Text>
      </View>

      <View
        style={[
          styles.tabsWrapper,
          useTabletLayout && {
            marginHorizontal: horizontalGutter,
            maxWidth: 520,
            alignSelf: "center",
            width: "100%",
          },
        ]}
      >
        <Pressable
          onPress={() => handleTabPress("upcoming")}
          style={[styles.tabButton, activeTab === "upcoming" && styles.activeTabButton]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            À venir {upcomingOrders.length > 0 ? `(${upcomingOrders.length})` : ""}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleTabPress("past")}
          style={[styles.tabButton, activeTab === "past" && styles.activeTabButton]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            Historique {pastOrders.length > 0 ? `(${pastOrders.length})` : ""}
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={scrollRef}
        data={[upcomingOrders, pastOrders]}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View
            style={{
              width: SCREEN_WIDTH,
              paddingHorizontal: useTabletLayout ? horizontalGutter : 0,
            }}
          >
            <FlatList
              data={item}
              keyExtractor={(order) => order.id}
              numColumns={useTabletLayout ? 2 : 1}
              key={useTabletLayout ? "tablet" : "phone"}
              columnWrapperStyle={
                useTabletLayout ? styles.tabletRow : undefined
              }
              renderItem={({ item: order }) => (
                <View style={useTabletLayout ? styles.tabletCard : undefined}>
                  <OrderListItem order={order} />
                </View>
              )}
              refreshControl={listRefreshControl}
              contentContainerStyle={[
                styles.listContent,
                item.length === 0 && styles.listContentEmpty,
              ]}
              ListEmptyComponent={() => renderEmptyState(index === 0 ? "upcoming" : "past")}
              ListFooterComponent={
                !authenticated ? (
                  <View style={styles.loginPromptWrapper}>
                    <LoginPrompt />
                  </View>
                ) : authenticated && item.length > 0 ? (
                  <View style={styles.syncFooter}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.syncFooterBtn,
                        (syncing || pressed) && { opacity: 0.85 },
                      ]}
                      onPress={() => void onSyncPress()}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <ActivityIndicator color={colors.green} />
                      ) : (
                        <Text style={styles.syncFooterText}>Synchroniser mes voyages</Text>
                      )}
                    </Pressable>
                  </View>
                ) : null
              }
            />
          </View>
        )}
      />
      </TabletContentShell>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F1F1F1",
  },
  /** Horizontal FlatList pages use full window width; avoid shell gutter double-inset. */
  shellFlush: {
    paddingHorizontal: 0,
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
    marginTop: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 16,
  },
  tabsWrapper: {
    flexDirection: "row",
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
    alignItems: "center",
    borderRadius: 10,
  },
  activeTabButton: { backgroundColor: colors.red },
  tabText: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
  },
  activeTabText: { color: "#FFFFFF" },
  inactiveTabText: { color: "#606060" },
  listContent: { paddingBottom: 40, flexGrow: 1 },
  tabletRow: {
    gap: 12,
  },
  tabletCard: {
    flex: 1,
    minWidth: 0,
  },
  listContentEmpty: { flexGrow: 1 },
  emptyContainer: {
    marginHorizontal: 16,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#E6F5F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "TTNormsPro-Bold",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  syncBtn: {
    marginTop: 22,
    minHeight: 52,
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  syncBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "TTNormsPro-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  syncFooter: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  syncFooterBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D8DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  syncFooterText: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: colors.green,
  },
});

export default OrdersList;
