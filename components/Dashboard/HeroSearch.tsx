import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Alert } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../Themed';
import { AssignedAttributeValueFragment, useGetAttributeBySlugQuery } from '../../saleor/api.generated';
import { mapEdgesToItems } from '../../utils/maps';
import { DateSelectionModal } from './DateSelectionModal';
import { CitySelectionModal } from './CitySelectionModal';
import { router } from 'expo-router';

const HeroSearch = () => {
  const [selectedOrigin, setSelectedOrigin] = useState<AssignedAttributeValueFragment>();
  const [selectedDestination, setSelectedDestination] = useState<AssignedAttributeValueFragment>();
  const [travelDate, setTravelDate] = useState(new Date());

  const [modalType, setModalType] = useState<'origin' | 'destination' | 'date' | null>(null);

  const { data: departureData } = useGetAttributeBySlugQuery({ variables: { slug: 'departure-city' } });
  const { data: arrivalData } = useGetAttributeBySlugQuery({ variables: { slug: 'arrival-city' } });

  const departureCities = mapEdgesToItems(departureData?.attribute?.choices);
  const arrivalCities = mapEdgesToItems(arrivalData?.attribute?.choices);

  const handleSwapCities = () => {
    const tempOrigin = selectedOrigin;
    setSelectedOrigin(selectedDestination);
    setSelectedDestination(tempOrigin);
  };

  const handleSearch = () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert("Oups !", "Veuillez sélectionner une ville de départ et une destination.");
      return;
    }

    const formattedDate = travelDate.toISOString().split('T')[0];

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
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={selectedOrigin ? "#E91E63" : "#666"} />
            <Text style={selectedOrigin ? styles.dateTextActive : styles.inputPlaceholder}>
              {selectedOrigin ? selectedOrigin.name : "De : ville de départ"}
            </Text>
          </TouchableOpacity>

          {/* Swap Button - Positioned Absolutely */}
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapCities} activeOpacity={0.8}>
            <MaterialCommunityIcons name="swap-vertical" size={24} color="#E91E63" />
          </TouchableOpacity>

          {/* Destination Trigger */}
          <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalType('destination')}>
            <MaterialCommunityIcons name="map-marker-check-outline" size={20} color={selectedDestination ? "#E91E63" : "#666"} />
            <Text style={selectedDestination ? styles.dateTextActive : styles.inputPlaceholder}>
              {selectedDestination ? selectedDestination.name : "À : destination"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Trigger */}
        <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalType('date')}>
          <FontAwesome5 name="calendar-alt" size={18} color="#666" />
          <Text style={styles.dateTextActive}>
            {travelDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
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
        cities={departureCities}
        onClose={() => setModalType(null)}
        onSelect={(city) => { setSelectedOrigin(city); setModalType(null); }}
      />

      <CitySelectionModal
        visible={modalType === 'destination'}
        title="Destination"
        cities={arrivalCities}
        onClose={() => setModalType(null)}
        onSelect={(city) => { setSelectedDestination(city); setModalType(null); }}
      />

      <DateSelectionModal
        visible={modalType === 'date'}
        date={travelDate}
        onClose={() => setModalType(null)}
        onSelect={(d) => setTravelDate(d)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomHalf: { flex: 1.2, paddingHorizontal: 20, backgroundColor: '#fff' },
  searchCard: {
    marginTop: -40,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  searchTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
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
  dateText: { fontSize: 16, color: '#999' },
  searchButton: {
    backgroundColor: '#E91E63',
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  searchButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    borderTopColor: '#eee',
  },
  confirmButton: {
    backgroundColor: '#E91E63',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#999', // Gray color like a real placeholder
    marginLeft: 10,
  },
  dateTextActive: {
    flex: 1,
    fontSize: 16,
    color: '#333', // Darker color for the selected date
    marginLeft: 10,
  },
  // If you used inputWrapper in the previous step, make sure it looks like this:
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#fff',
  },
  swapButton: {
    position: 'absolute',
    right: 20,
    top: '50%', // Move to middle of the container
    marginTop: -22, // Half of height (plus margin adjustment) to center between inputs
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    // Shadow/Elevation to make it pop
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
});

export default HeroSearch;