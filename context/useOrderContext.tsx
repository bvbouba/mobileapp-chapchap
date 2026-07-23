import { ApolloError } from "@apollo/client";
import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OrderFragment, useGetOrderByIdLazyQuery } from "../saleor/api.generated";
import { handleErrors } from "./checkout";
import { useAuth } from "../lib/providers/authProvider";
import {
  useMyOrdersLazyQuery,
  useSyncMyOrdersMutation,
} from "../graphql/syncOrders";

const ORDERS_STORAGE_KEY = "@SaleorApp:orders";

interface OrdersContextModel {
  recentOrderId: string | undefined;
  setRecentOrderId: (id: string) => void;
  recentOrder: OrderFragment | undefined;
  orders: OrderFragment[];
  loaded: boolean | undefined;
  loading: boolean | undefined;
  syncing: boolean;
  error: ApolloError | undefined;
  syncMyOrders: () => Promise<{ linkedCount: number; ok: boolean; message?: string }>;
  clearLocalOrders: () => Promise<void>;
  refreshAccountOrders: () => Promise<void>;
  /** Re-fetch list from network (account or local IDs). */
  refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextModel>({
  recentOrder: undefined,
  recentOrderId: undefined,
  orders: [],
  loading: undefined,
  loaded: undefined,
  syncing: false,
  error: undefined,
  setRecentOrderId: () => {},
  syncMyOrders: async () => ({ linkedCount: 0, ok: false }),
  clearLocalOrders: async () => {},
  refreshAccountOrders: async () => {},
  refreshOrders: async () => {},
});

export const useOrderContext = () => useContext(OrdersContext);

export const OrderProvider: FC<PropsWithChildren> = ({ children }) => {
  const { authenticated } = useAuth();
  const [savedOrders, setSavedOrders] = useState<OrderFragment[]>([]);
  const [recentOrderId, setRecentOrderId] = useState<string | undefined>(undefined);
  const [recentOrder, setRecentOrder] = useState<OrderFragment | undefined>(undefined);
  const [syncing, setSyncing] = useState(false);

  const [getOrderById, getOrderByIdStatus] = useGetOrderByIdLazyQuery();
  const [fetchMyOrders] = useMyOrdersLazyQuery();
  const [syncMyOrdersMutation] = useSyncMyOrdersMutation();

  const loading = getOrderByIdStatus.loading || syncing;
  const loaded = getOrderByIdStatus.called || savedOrders.length > 0;
  const error = getOrderByIdStatus.error;

  const clearLocalOrders = useCallback(async () => {
    await AsyncStorage.removeItem(ORDERS_STORAGE_KEY);
  }, []);

  const fetchOrdersByIds = useCallback(
    async (orderIds: string[]): Promise<OrderFragment[]> => {
      const unique = [...new Set(orderIds.filter(Boolean))];
      const found = await Promise.all(
        unique.map((id) =>
          getOrderById({
            variables: { id },
            fetchPolicy: "network-only",
          }).then((res) => res.data?.order as OrderFragment | undefined),
        ),
      );
      return found.filter((o): o is OrderFragment => !!o);
    },
    [getOrderById],
  );

  const refreshAccountOrders = useCallback(async () => {
    if (!authenticated) return;
    const res = await fetchMyOrders({
      variables: { first: 50 },
      fetchPolicy: "network-only",
    });
    const edges = res.data?.me?.orders?.edges ?? [];
    setSavedOrders(edges.map((e) => e.node));
  }, [authenticated, fetchMyOrders]);

  const syncMyOrders = useCallback(async () => {
    if (!authenticated) {
      return { linkedCount: 0, ok: false, message: "Connectez-vous pour synchroniser." };
    }
    setSyncing(true);
    try {
      const res = await syncMyOrdersMutation();
      const payload = res.data?.syncMyOrders;
      const errors = payload?.errors ?? [];
      if (errors.length > 0) {
        return {
          linkedCount: 0,
          ok: false,
          message: errors[0]?.message || "Synchronisation impossible.",
        };
      }

      // After sync: drop device-local order IDs — account is source of truth.
      await clearLocalOrders();

      const orderIds = (payload?.orderIds ?? []).filter(Boolean);
      if (orderIds.length > 0) {
        const orders = await fetchOrdersByIds(orderIds);
        setSavedOrders(orders);
      } else {
        await refreshAccountOrders();
      }

      return {
        linkedCount: payload?.linkedCount ?? 0,
        ok: true,
      };
    } catch (e) {
      return {
        linkedCount: 0,
        ok: false,
        message: e instanceof Error ? e.message : "Synchronisation impossible.",
      };
    } finally {
      setSyncing(false);
    }
  }, [
    authenticated,
    clearLocalOrders,
    fetchOrdersByIds,
    refreshAccountOrders,
    syncMyOrdersMutation,
  ]);

  const loadOrder = async () => {
    const res = await getOrderById({
      variables: {
        id: recentOrderId as string,
      },
    });

    handleErrors(res);
    const order = res.data?.order as OrderFragment | undefined;
    setRecentOrder(order);
    if (order) {
      setSavedOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    }
  };

  useEffect(() => {
    if (recentOrderId) {
      void loadOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentOrderId]);

  const refreshOrders = useCallback(async () => {
    if (authenticated) {
      await refreshAccountOrders();
      return;
    }
    const ordersListString = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
    if (ordersListString) {
      const orderIds = ordersListString.split(",").filter(Boolean);
      const foundOrders = await fetchOrdersByIds(orderIds);
      setSavedOrders(foundOrders);
    } else {
      setSavedOrders([]);
    }
  }, [authenticated, fetchOrdersByIds, refreshAccountOrders]);

  useEffect(() => {
    void refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const handleRecentOrder = (orderId: string) => {
    if (!authenticated) {
      void AsyncStorage.setItem(
        ORDERS_STORAGE_KEY,
        [orderId, ...savedOrders.map((s) => s.id)].join(","),
      );
    }
    setRecentOrderId(orderId);
  };

  return (
    <OrdersContext.Provider
      value={{
        recentOrder: recentOrder,
        recentOrderId: recentOrderId,
        setRecentOrderId: handleRecentOrder,
        orders: savedOrders,
        error,
        loading,
        loaded,
        syncing,
        syncMyOrders,
        clearLocalOrders,
        refreshAccountOrders,
        refreshOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};
