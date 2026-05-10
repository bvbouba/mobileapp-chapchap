import React, { useEffect, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  useProductVariantCollectionQuery,
  ProductVariantWhereInput,
  ProductVariantSortField,
  OrderDirection,
  ProductVariantListItemFragment,
} from "../../saleor/api.generated";
import { getConfig } from "../../config";
import { mapEdgesToItems } from "../../utils/maps";
import { getBookableDepartureDateTimeRange } from "../../utils/departureTimeFilter";
import { ProductElement } from "./ProductElement";
import { Text } from "../Themed";
import { EllipsisLoader } from "../EllipsisLoader";

export type TripsBarStats = {
  cheapestLabel: string;
};

interface Props {
  originSlug: string;
  destinationSlug: string;
  date: string;
  where?: ProductVariantWhereInput;
  sortBy?: {
    field: ProductVariantSortField;
    direction: OrderDirection;
  };
  setCounter?: (count: number) => void;
  setStats?: React.Dispatch<React.SetStateAction<TripsBarStats>>;
}

export const ProductCollection = ({
  originSlug,
  destinationSlug,
  date,
  where,
  sortBy,
  setCounter,
  setStats,
}: Props) => {
  const bookingCutoffMinutes = getConfig().bookingCutoffMinutesBeforeDeparture;

  const mergedWhere: ProductVariantWhereInput = useMemo(() => {
    const { gte, lte } = getBookableDepartureDateTimeRange(date, bookingCutoffMinutes);
    return {
      ...where,
      attributes: [
        ...(where?.attributes ?? []),
        { slug: "departure-city", value: { slug: { oneOf: [originSlug] } } },
        { slug: "arrival-city", value: { slug: { oneOf: [destinationSlug] } } },
        {
          slug: "departure-time",
          value: {
            dateTime: {
              gte,
              lte,
            },
          },
        },
      ],
    };
  }, [where, originSlug, destinationSlug, date, bookingCutoffMinutes]);

  const { data, loading, error, fetchMore } = useProductVariantCollectionQuery({
    variables: {
      where: mergedWhere,
      sortBy: sortBy,
      channel: "ci",
      first: 10,
    },
    notifyOnNetworkStatusChange: true,
  });

  const lastTotalRef = useRef<number | null>(null);
  useEffect(() => {
    if (!setCounter || data?.productVariants?.totalCount === undefined) return;
    const n = data.productVariants.totalCount || 0;
    if (lastTotalRef.current === n) return;
    lastTotalRef.current = n;
    setCounter(n);
  }, [data?.productVariants?.totalCount, setCounter]);

  const variants = mapEdgesToItems(data?.productVariants);

  const getCheapestLabel = (items: ProductVariantListItemFragment[]) => {
    const prices = items
      .map((v) => v.pricing?.price?.gross)
      .filter(
        (p): p is { amount: number; currency: string } =>
          !!p && typeof p.amount === "number"
      );
    if (!prices.length) return "—";
    const cheapest = prices.reduce((min, p) =>
      p.amount < min.amount ? p : min
    , prices[0]);
    return `${cheapest.amount} ${cheapest.currency}`;
  };

  const barStats = useMemo((): TripsBarStats => {
    const items = mapEdgesToItems(data?.productVariants);
    return {
      cheapestLabel: getCheapestLabel(items),
    };
  }, [data?.productVariants]);

  const lastStatsKeyRef = useRef("");
  useEffect(() => {
    if (!setStats) return;
    const key = barStats.cheapestLabel;
    if (key === lastStatsKeyRef.current) return;
    lastStatsKeyRef.current = key;
    setStats(barStats);
  }, [barStats, setStats]);

  const handleLoadMore = () => {
    if (data?.productVariants?.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.productVariants.pageInfo.endCursor,
        },
      });
    }
  };

  if (loading && !data) {
    return (
      <View style={styles.fill}>
        <View style={styles.centered}>
          <EllipsisLoader color="#EB1700" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fill}>
        <View style={styles.centered}>
          <Text style={styles.error}>Erreur lors du chargement des trajets.</Text>
        </View>
      </View>
    );
  }

  if (variants.length === 0 && !loading) {
    return (
      <View style={styles.fill}>
        <View style={styles.centered}>
          <Text style={styles.empty}>Aucun trajet trouvé pour cette sélection.</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={variants}
      style={styles.list}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductElement variant={item} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? (
          <View style={{ margin: 10, alignItems: "center" }}>
            <EllipsisLoader color="#EB1700" />
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: "#F1F1F1",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  list: { flex: 1, backgroundColor: "#F1F1F1" },
  empty: {
    textAlign: "center",
    color: "#606060",
    fontSize: 16,
    fontFamily: "TTNormsPro-Regular",
  },
  error: {
    textAlign: "center",
    color: "#EB1700",
    fontFamily: "TTNormsPro-Regular",
  },
});
