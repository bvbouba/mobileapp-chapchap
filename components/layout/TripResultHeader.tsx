import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, colors } from '../Themed';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!y || !m || !d) return dateStr;
      const dateObj = new Date(y, m - 1, d);
      
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#000000" />
        </TouchableOpacity>
        
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

        <View style={{ width: 40 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D7D8DB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  container: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "#F1F1F1",
    borderWidth: 0,
    borderColor: "#D7D8DB",
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
    color: '#000000',
    fontFamily: 'TTNormsPro-Bold',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 13,
    color: '#606060',
    marginTop: 2,
    fontFamily: 'TTNormsPro-Regular',
    textTransform: 'capitalize', 
  },
});

export default TripResultHeader;