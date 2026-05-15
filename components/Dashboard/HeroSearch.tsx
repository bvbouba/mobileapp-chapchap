import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../Themed';
import { AssignedAttributeValueFragment, useGetAttributeBySlugQuery } from '../../saleor/api.generated';
import { mapEdgesToItems } from '../../utils/maps';
import { DateSelectionModal } from './DateSelectionModal';
import { CitySelectionModal } from './CitySelectionModal';
import { router } from 'expo-router';
import { formatFrenchHeroTripDate } from '../../utils/attribute';

const HeroSearch = () => {
  const [selectedOrigin, setSelectedOrigin] = useState<AssignedAttributeValueFragment>();
  const [selectedDestination, setSelectedDestination] = useState<AssignedAttributeValueFragment>();
  const [travelDate, setTravelDate] = useState(new Date());
  const [hasSelectedDate, setHasSelectedDate] = useState(true);

  const [modalType, setModalType] = useState<'origin' | 'destination' | 'date' | null>(null);

  const {
    data: departureData,
    loading: loadingDepartureCities,
    error: departureCitiesError,
  } = useGetAttributeBySlugQuery({
    variables: { slug: 'departure-city' },
    skip: modalType !== 'origin',
    fetchPolicy: 'cache-first',
  });
  const {
    data: arrivalData,
    loading: loadingArrivalCities,
    error: arrivalCitiesError,
  } = useGetAttributeBySlugQuery({
    variables: { slug: 'arrival-city' },
    skip: modalType !== 'destination',
    fetchPolicy: 'cache-first',
  });
  const departureCities = mapEdgesToItems(departureData?.attribute?.choices);
  const arrivalCities = mapEdgesToItems(arrivalData?.attribute?.choices);
  const selectedOriginSlug = selectedOrigin?.slug;
  const selectedDestinationSlug = selectedDestination?.slug;
  const originOptions = departureCities.filter((city) => city.slug !== selectedDestinationSlug);
  const destinationOptions = arrivalCities.filter((city) => city.slug !== selectedOriginSlug);

  const handleSwapCities = () => {
    const tempOrigin = selectedOrigin;
    setSelectedOrigin(selectedDestination);
    setSelectedDestination(tempOrigin);
  };

  const formatLocalDateKey = (value: Date) => {
    const y = value.getFullYear();
    const m = `${value.getMonth() + 1}`.padStart(2, "0");
    const d = `${value.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleSearch = () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert("Oups !", "Veuillez sélectionner une ville de départ et une destination.");
      return;
    }

    const formattedDate = formatLocalDateKey(travelDate);

    router.push({
      pathname: '/products/results', // Ensure this matches your file path
      params: {
        origin: selectedOrigin.id,
        destination: selectedDestination.id,
        date: formattedDate,
        originName: selectedOrigin.name,     
        destinationName: selectedDestination.name,
      }
    });
  };

  return (
    <View style={styles.bottomHalf}>
      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>Où allez-vous ?</Text>

        {/* Container for Origin, Destination and the Swap Button */}
        <View style={{ position: 'relative' }}>
          {/* Origin Trigger */}
          <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalType('origin')}>
            <Ionicons name="location-outline" size={20} color={selectedOrigin ? "#EB1700" : "#606060"} />
            <Text style={selectedOrigin ? styles.dateTextActive : styles.inputPlaceholder}>
              {selectedOrigin ? selectedOrigin.name : "De : ville de départ"}
            </Text>
          </TouchableOpacity>

          {/* Swap Button - Positioned Absolutely */}
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapCities} activeOpacity={0.8}>
            <MaterialCommunityIcons name="swap-vertical" size={24} color="#EB1700" />
          </TouchableOpacity>

          {/* Destination Trigger */}
          <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalType('destination')}>
            <Ionicons name="flag-outline" size={20} color={selectedDestination ? "#EB1700" : "#606060"} />
            <Text style={selectedDestination ? styles.dateTextActive : styles.inputPlaceholder}>
              {selectedDestination ? selectedDestination.name : "À : destination"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Trigger */}
        <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalType('date')}>
          <Ionicons name="calendar-outline" size={20} color={hasSelectedDate ? "#EB1700" : "#606060"} />
          <Text style={hasSelectedDate ? styles.dateTextActive : styles.inputPlaceholder}>
            {hasSelectedDate ? formatFrenchHeroTripDate(travelDate) : "Date du voyage"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>RECHERCHER</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CitySelectionModal
        visible={modalType === 'origin'}
        title="Ville de départ"
        cities={originOptions}
        loading={loadingDepartureCities}
        errorMessage={departureCitiesError?.message}
        onClose={() => setModalType(null)}
        onSelect={(city) => {
          if (city.slug === selectedDestinationSlug) {
            Alert.alert("Ville invalide", "La ville de départ doit être différente de la destination.");
            return;
          }
          setSelectedOrigin(city);
          setModalType(null);
        }}
      />

      <CitySelectionModal
        visible={modalType === 'destination'}
        title="Destination"
        cities={destinationOptions}
        loading={loadingArrivalCities}
        errorMessage={arrivalCitiesError?.message}
        onClose={() => setModalType(null)}
        onSelect={(city) => {
          if (city.slug === selectedOriginSlug) {
            Alert.alert("Ville invalide", "La destination doit être différente de la ville de départ.");
            return;
          }
          setSelectedDestination(city);
          setModalType(null);
        }}
      />

      <DateSelectionModal
        visible={modalType === 'date'}
        date={travelDate}
        onClose={() => setModalType(null)}
        onSelect={(d) => {
          setTravelDate(d);
          setHasSelectedDate(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomHalf: { flex: 1.2, paddingHorizontal: 20, backgroundColor: '#FFFFFF' },
  searchCard: {
    marginTop: -40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  searchTitle: {
    fontSize: 22,
    marginBottom: 20,
    color: '#000000',
    fontFamily: 'TTNormsPro-Bold',
  },
  inputContainer: { zIndex: 5, position: 'relative' }, // Important for suggestion overlay
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  suggestionsList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: -15,
    marginBottom: 15,
    paddingVertical: 5,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  suggestionText: { marginLeft: 10, fontSize: 15, color: '#444' },
  dateText: { fontSize: 16, color: '#606060', fontFamily: 'TTNormsPro-Regular' },
  searchButton: {
    backgroundColor: '#EB1700',
    height: 55,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'TTNormsPro-Bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D7D8DB',
  },
  backButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    color: '#000000',
    fontFamily: 'TTNormsPro-Bold',
  },
  pickerWrapper: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#D7D8DB',
  },
  confirmButton: {
    backgroundColor: '#EB1700',
    height: 55,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'TTNormsPro-Bold',
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#606060',
    marginLeft: 10,
    fontFamily: 'TTNormsPro-Regular',
  },
  dateTextActive: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 10,
    fontFamily: 'TTNormsPro-Regular',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7D8DB',
    borderRadius: 14,
    marginBottom: 15,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#F1F1F1',
  },
  swapButton: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -22,
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#D7D8DB',
  },
});

export default HeroSearch;