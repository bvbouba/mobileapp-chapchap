import { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, colors } from "../Themed";
import {
  AssignedAttributeValueFragment,
  useGetAttributeBySlugQuery,
} from "../../saleor/api.generated";
import { mapEdgesToItems } from "../../utils/maps";
import { DateSelectionModal } from "./DateSelectionModal";
import { CitySelectionModal } from "./CitySelectionModal";
import { router } from "expo-router";
import { formatFrenchHeroTripDate } from "../../utils/attribute";

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number): Date {
  const next = startOfDay(value);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatLocalDateKey(value: Date): string {
  const y = value.getFullYear();
  const m = `${value.getMonth() + 1}`.padStart(2, "0");
  const d = `${value.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type DateChipKind = "today" | "tomorrow" | "other";

type Props = {
  /** Tablet landscape: no negative overlap; sit flush in the right pane. */
  flat?: boolean;
};

const HeroSearch = ({ flat = false }: Props) => {
  const [selectedOrigin, setSelectedOrigin] =
    useState<AssignedAttributeValueFragment>();
  const [selectedDestination, setSelectedDestination] =
    useState<AssignedAttributeValueFragment>();
  const [travelDate, setTravelDate] = useState(() => startOfDay(new Date()));
  const [modalType, setModalType] = useState<
    "origin" | "destination" | "date" | null
  >(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  const activeChip: DateChipKind = isSameDay(travelDate, today)
    ? "today"
    : isSameDay(travelDate, tomorrow)
      ? "tomorrow"
      : "other";

  const {
    data: departureData,
    loading: loadingDepartureCities,
    error: departureCitiesError,
  } = useGetAttributeBySlugQuery({
    variables: { slug: "departure-city" },
    fetchPolicy: "cache-first",
  });
  const {
    data: arrivalData,
    loading: loadingArrivalCities,
    error: arrivalCitiesError,
  } = useGetAttributeBySlugQuery({
    variables: { slug: "arrival-city" },
    fetchPolicy: "cache-first",
  });
  const departureCities = mapEdgesToItems(departureData?.attribute?.choices);
  const arrivalCities = mapEdgesToItems(arrivalData?.attribute?.choices);
  const selectedOriginSlug = selectedOrigin?.slug;
  const selectedDestinationSlug = selectedDestination?.slug;
  const originOptions = departureCities.filter(
    (city) => city.slug !== selectedDestinationSlug,
  );
  const destinationOptions = arrivalCities.filter(
    (city) => city.slug !== selectedOriginSlug,
  );

  const handleSwapCities = () => {
    setSelectedOrigin(selectedDestination);
    setSelectedDestination(selectedOrigin);
  };

  const handleSearch = () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert(
        "Où allez-vous ?",
        "Choisissez une ville de départ et une destination.",
      );
      return;
    }

    router.push({
      pathname: "/products/results",
      params: {
        origin: selectedOrigin.id,
        destination: selectedDestination.id,
        date: formatLocalDateKey(travelDate),
        originName: selectedOrigin.name,
        destinationName: selectedDestination.name,
      },
    });
  };

  return (
    <View style={[styles.bottomHalf, flat && styles.bottomHalfFlat]}>
      <View style={[styles.searchCard, flat && styles.searchCardFlat]}>
        <Text style={styles.searchTitle}>Où allez-vous ?</Text>

        <View style={[styles.routeBlock, flat && styles.routeBlockFlat]}>
          <View style={flat ? styles.cityColumn : undefined}>
          <Text style={styles.fieldLabel}>Ville de départ</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setModalType("origin")}
            accessibilityRole="button"
            accessibilityLabel="Choisir la ville de départ"
          >
            <MaterialCommunityIcons
              name="bus-side"
              size={22}
              color={selectedOrigin ? colors.primary : colors.grey500}
            />
            <Text
              style={
                selectedOrigin ? styles.inputValue : styles.inputPlaceholder
              }
              numberOfLines={1}
            >
              {selectedOrigin ? selectedOrigin.name : "Choisir le départ"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.grey500} />
          </TouchableOpacity>
          </View>

          <View style={flat ? styles.swapRowFlat : styles.swapRow}>
            {!flat ? <View style={styles.swapLine} /> : null}
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwapCities}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Permuter départ et destination"
            >
              <MaterialCommunityIcons
                name={flat ? "swap-horizontal" : "swap-vertical"}
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
            {!flat ? <View style={styles.swapLine} /> : null}
          </View>

          <View style={flat ? styles.cityColumn : undefined}>
          <Text style={styles.fieldLabel}>Ville de destination</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setModalType("destination")}
            accessibilityRole="button"
            accessibilityLabel="Choisir la destination"
          >
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={22}
              color={selectedDestination ? colors.primary : colors.grey500}
            />
            <Text
              style={
                selectedDestination ? styles.inputValue : styles.inputPlaceholder
              }
              numberOfLines={1}
            >
              {selectedDestination
                ? selectedDestination.name
                : "Choisir la destination"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.grey500} />
          </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 4 }]}>Date de voyage</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, activeChip === "today" && styles.chipActive]}
            onPress={() => setTravelDate(today)}
            accessibilityRole="button"
            accessibilityState={{ selected: activeChip === "today" }}
          >
            <Text
              style={[
                styles.chipText,
                activeChip === "today" && styles.chipTextActive,
              ]}
            >
              Aujourd&apos;hui
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.chip,
              activeChip === "tomorrow" && styles.chipActive,
            ]}
            onPress={() => setTravelDate(tomorrow)}
            accessibilityRole="button"
            accessibilityState={{ selected: activeChip === "tomorrow" }}
          >
            <Text
              style={[
                styles.chipText,
                activeChip === "tomorrow" && styles.chipTextActive,
              ]}
            >
              Demain
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, activeChip === "other" && styles.chipActive]}
            onPress={() => setModalType("date")}
            accessibilityRole="button"
            accessibilityLabel="Choisir une autre date"
            accessibilityState={{ selected: activeChip === "other" }}
          >
            <Ionicons
              name="calendar-outline"
              size={15}
              color={activeChip === "other" ? colors.primary : colors.grey500}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.chipText,
                activeChip === "other" && styles.chipTextActive,
              ]}
              numberOfLines={1}
            >
              {activeChip === "other"
                ? formatFrenchHeroTripDate(travelDate)
                : "Autre date"}
            </Text>
          </Pressable>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          accessibilityRole="button"
          accessibilityLabel="Rechercher un bus"
        >
          <Ionicons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>Rechercher un bus</Text>
        </TouchableOpacity>
      </View>

      <CitySelectionModal
        visible={modalType === "origin"}
        title="Ville de départ"
        cities={originOptions}
        loading={loadingDepartureCities}
        errorMessage={departureCitiesError?.message}
        onClose={() => setModalType(null)}
        onSelect={(city) => {
          if (city.slug === selectedDestinationSlug) {
            Alert.alert(
              "Ville invalide",
              "La ville de départ doit être différente de la destination.",
            );
            return;
          }
          setSelectedOrigin(city);
          setModalType(null);
        }}
      />

      <CitySelectionModal
        visible={modalType === "destination"}
        title="Destination"
        cities={destinationOptions}
        loading={loadingArrivalCities}
        errorMessage={arrivalCitiesError?.message}
        onClose={() => setModalType(null)}
        onSelect={(city) => {
          if (city.slug === selectedOriginSlug) {
            Alert.alert(
              "Ville invalide",
              "La destination doit être différente de la ville de départ.",
            );
            return;
          }
          setSelectedDestination(city);
          setModalType(null);
        }}
      />

      <DateSelectionModal
        visible={modalType === "date"}
        date={travelDate}
        onClose={() => setModalType(null)}
        onSelect={(d) => {
          setTravelDate(startOfDay(d));
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomHalf: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
  },
  bottomHalfFlat: {
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  searchCard: {
    marginTop: -44,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "#E8E9EC",
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 10,
  },
  searchCardFlat: {
    marginTop: 0,
  },
  greeting: {
    fontSize: 14,
    color: colors.grey500,
    fontFamily: "TTNormsPro-Regular",
    marginBottom: 2,
  },
  searchTitle: {
    fontSize: 22,
    marginBottom: 18,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
    letterSpacing: -0.3,
  },
  routeBlock: {
    marginBottom: 4,
  },
  routeBlockFlat: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  cityColumn: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.grey500,
    fontFamily: "TTNormsPro-Regular",
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E3E7",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: "#F7F7F8",
    gap: 8,
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: colors.grey500,
    fontFamily: "TTNormsPro-Regular",
  },
  inputValue: {
    flex: 1,
    fontSize: 16,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  swapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  swapRowFlat: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 6,
  },
  swapLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D7D8DB",
  },
  swapButton: {
    marginHorizontal: 10,
    backgroundColor: "#FFFFFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E3E7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E3E7",
    backgroundColor: "#F7F7F8",
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(235, 23, 0, 0.08)",
  },
  chipText: {
    fontSize: 13,
    color: colors.grey500,
    fontFamily: "TTNormsPro-Regular",
  },
  chipTextActive: {
    color: colors.primary,
    fontFamily: "TTNormsPro-Bold",
  },
  searchButton: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
  },
});

export default HeroSearch;
