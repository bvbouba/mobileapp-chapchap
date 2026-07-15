import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ProductCollection, TripsBarStats } from "./ProductCollection";
import { Text } from "../Themed";

import {
  AssignedAttributeValueFragment,
  AttributeFilterFragment,
  OrderDirection,
  ProductVariantSortField,
  ProductVariantWhereInput,
} from "../../saleor/api.generated";
import { FilterModal } from "./filter/FilterModal";

type ResultsSortMode = "chaplist" | "cheapest";

interface Props {
  originData: AssignedAttributeValueFragment | null | undefined;
  destinationData: AssignedAttributeValueFragment | null | undefined;
  selectedDate: string;
  attributeFiltersData: AttributeFilterFragment[];
}

export const FilteredProductList = ({
  originData,
  destinationData,
  selectedDate,
  attributeFiltersData,
}: Props) => {
  const insets = useSafeAreaInsets();
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortMode, setSortMode] = useState<ResultsSortMode>("chaplist");
  const [tripTotal, setTripTotal] = useState<number | null>(null);
  const [stats, setStats] = useState<TripsBarStats>({
    cheapestLabel: "—",
  });

  const graphqlSort = useMemo(() => {
    if (sortMode === "cheapest") {
      return {
        field: ProductVariantSortField.Price,
        direction: OrderDirection.Asc,
      };
    }
    return undefined;
  }, [sortMode]);

  const productVariantsWhere: ProductVariantWhereInput = useMemo(
    () => ({
      attributes: Object.entries(activeFilters)
        .filter(([_, values]) => values.length > 0)
        .map(([slug, values]) => ({ slug, value: { slug: { oneOf: values } } })),
    }),
    [activeFilters]
  );

  const activeFilterCount = Object.values(activeFilters).flat().length;
  const filterActive = activeFilterCount > 0;

  const handleAddFilter = (slug: string, choice: string) => {
    setActiveFilters((prev) => {
      const vals = prev[slug] || [];
      return {
        ...prev,
        [slug]: vals.includes(choice)
          ? vals.filter((v) => v !== choice)
          : [...vals, choice],
      };
    });
  };

  const tripSubLabel =
    tripTotal === null
      ? "…"
      : tripTotal === 0
        ? "Aucun trajet"
        : `${tripTotal} trajet${tripTotal > 1 ? "s" : ""}`;

  if (!originData || !destinationData) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barScroll}
        style={styles.barScrollOuter}
      >
        <TouchableOpacity
          style={[styles.barChip, styles.barChipFilter, filterActive && styles.barChipActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.85}
        >
          {activeFilterCount > 0 && (
            <View style={styles.badgeFloating}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
          <View style={styles.barChipInner}>
            <Text style={[styles.barChipTitle, filterActive && styles.barChipTitleActive]}>
              FILTRER
            </Text>
            <MaterialCommunityIcons
              name="filter-variant"
              size={14}
              color={filterActive ? "#FFFFFF" : "#606060"}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.barChip, sortMode === "chaplist" && styles.barChipActive]}
          onPress={() => setSortMode("chaplist")}
          activeOpacity={0.85}
        >
          <Text style={[styles.barChipTitle, sortMode === "chaplist" && styles.barChipTitleActive]}>
            CHAPLIST
          </Text>
          <Text
            style={[styles.barChipSub, sortMode === "chaplist" && styles.barChipSubActive]}
          >
            {tripSubLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.barChip, sortMode === "cheapest" && styles.barChipActive]}
          onPress={() => setSortMode("cheapest")}
          activeOpacity={0.85}
        >
          <Text style={[styles.barChipTitle, sortMode === "cheapest" && styles.barChipTitleActive]}>
            MOINS CHER
          </Text>
          <Text
            style={[styles.barChipSub, sortMode === "cheapest" && styles.barChipSubActive]}
          >
            {stats.cheapestLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.listSlot}>
        <ProductCollection
          where={productVariantsWhere}
          sortBy={graphqlSort}
          originSlug={originData.slug ?? ""}
          destinationSlug={destinationData.slug ?? ""}
          date={selectedDate}
          setCounter={setTripTotal}
          setStats={setStats}
        />
      </View>

      <FilterModal
        isVisible={showFilter}
        onClose={() => setShowFilter(false)}
        insets={insets}
        activeFilters={activeFilters}
        attributeFiltersData={attributeFiltersData}
        onAddFilter={handleAddFilter}
        onClear={() => setActiveFilters({})}
        activeCount={activeFilterCount}
      />
    </View>
  );
};

const SECONDARY = "#A6C65A";

const styles = StyleSheet.create({
  container: { flex: 1 },
  barScrollOuter: {
    flexGrow: 0,
    flexShrink: 0,
  },
  listSlot: {
    flex: 1,
    minHeight: 0,
  },
  barScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingRight: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#D7D8DB",
  },
  barChip: {
    minHeight: 44,
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#D7D8DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  barChipFilter: {
    position: "relative",
    overflow: "visible",
  },
  barChipActive: {
    backgroundColor: SECONDARY,
    borderColor: SECONDARY,
  },
  barChipInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  barChipTitle: {
    fontSize: 11,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
    textAlign: "center",
  },
  barChipTitleActive: {
    color: "#FFFFFF",
  },
  barChipSub: {
    marginTop: 1,
    fontSize: 9,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
    textAlign: "center",
  },
  barChipSubActive: {
    color: "#FFFFFF",
  },
  badgeFloating: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#EB1700",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "TTNormsPro-Bold",
  },
});
