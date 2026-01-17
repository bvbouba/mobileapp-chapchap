import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, colors } from '../Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TripResultHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { originName, destinationName, date } = useGlobalSearchParams<{ 
    originName: string; 
    destinationName: string; 
    date: string 
  }>();

  // Helper to format: "mer. 14 janv."
  const formatFrenchDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    
    try {
      // Parse the YYYY-MM-DD string
      const dateObj = new Date(dateStr);
      
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short', // "mer."
        day: 'numeric',   // "14"
        month: 'short',   // "janv."
      }).format(dateObj);
    } catch (e) {
      return dateStr; // Fallback to raw string if parsing fails
    }
  };

  const displayDate = formatFrenchDate(date);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <IconButton
          icon="arrow-left"
          onPress={() => router.back()}
          iconColor={colors.blue}
          size={24}
        />
        
        <View style={styles.infoContainer}>
          <View style={styles.routeRow}>
            <Text style={styles.cityText}>{originName || "Départ"}</Text>
            <MaterialCommunityIcons 
              name="arrow-right" 
              size={16} 
              color={colors.blue} 
              style={{ marginHorizontal: 8 }} 
            />
            <Text style={styles.cityText}>{destinationName || "Arrivée"}</Text>
          </View>
          {/* Apply the formatted date here */}
          <Text style={styles.dateText}>
            {displayDate ? `Départ ${displayDate}` : "Date non sélectionnée"}
          </Text>
        </View>

        <View style={{ width: 48 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // Elevation for Android shadow, Shadow for iOS
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize', 
  },
});

export default TripResultHeader;