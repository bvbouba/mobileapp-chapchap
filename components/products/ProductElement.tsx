import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Text, colors } from '../Themed';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { ProductVariantListItemFragment } from '../../saleor/api.generated';
import { useCartContext } from '../../context/useCartContext';
import { useRouter } from 'expo-router';
import { GlobalLoadingOverlay } from '../GlobalLoadingOverlay';
import { TripDetailsModal } from './TripDetails/TripDetailsModal';

interface Props {
  variant: ProductVariantListItemFragment;
}

export const ProductElement = ({ variant }: Props) => {
  const attributes = variant.attributes || [];
  const [showDetails, setShowDetails] = useState(false);
  const { addItem, loading } = useCartContext();
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handlePress = async () => {
    if (isActionLoading) return;

    setIsActionLoading(true); 
    try {
      await addItem(variant?.id);      
      router.push("/cart");
    } catch (error) {
      console.error(error);
    } finally {
      // If navigation is instant, this might unmount before finishing
      setIsActionLoading(false); 
    }
  };


  const getAttrValue = (slug: string): string | undefined => {
    const found = attributes.find((attr) => attr.attribute?.slug === slug);
    return found?.values?.[0]?.name ?? found?.values?.[0]?.value ?? undefined;
  };

  const getAttrValues = (slug: string) => {
    const found = attributes.find((attr) => attr.attribute?.slug === slug);
    return found?.values 
  };
  
  // Duration Parsing Logic
  const parseDurationToMinutes = (raw?: string): number => {
    if (!raw) return 0;
    const s = raw.trim().toLowerCase();
    const hmMatch = s.match(/(\d+)\s*h(?:ours?)?\s*(\d+)?/);
    if (hmMatch) {
      const h = parseInt(hmMatch[1], 10);
      const m = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
      return h * 60 + m;
    }
    const numMatch = s.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1], 10) : 0;
  };

  const formatMinutes = (mins: number): string | null => {
    if (!mins || mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h === 0 ? `${m}min` : `${h}h ${m.toString().padStart(2, "0")}m`;
  };

  const durationRaw = getAttrValue("estimated-duration");
  const company = getAttrValue("bus-operator");
  const departureStation = getAttrValue("departure-station");
  const arrivalStation = getAttrValue("arrival-station");
  const dateTime = getAttrValue("departure-time");

  const departureDate = dateTime ? new Date(dateTime) : null;
  const durationMinutes = parseDurationToMinutes(durationRaw);
  const readableDuration = formatMinutes(durationMinutes);

  let arrivalTimeStr = "--:--";
  if (departureDate && durationMinutes > 0) {
    const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60_000);
    arrivalTimeStr = arrivalDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  const departureTimeStr = departureDate
    ? departureDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : "--:--";

  const price = variant.pricing?.price?.gross;

  const logoUrl = variant.product?.thumbnail?.url;
  
  return (
    <View>
      <TouchableOpacity style={styles.card} activeOpacity={0.9}>
        {/* HEADER: Adjusted margin for vertical space */}
        <View style={styles.header}>
          <View style={styles.companyRow}>
            <FontAwesome5 name="bus" size={12} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.companyName}>{company ?? "Compagnie"}</Text>
          </View>
          <Text style={styles.priceText}>
            {price?.amount} {price?.currency}
          </Text>
        </View>

        {/* TRIP BODY: Width constrained to 75% to prevent overlap with price */}
        <View style={[styles.tripBody, { width: '75%' }]}>

          {/* LEFT COLUMN: Departure */}
          <View style={styles.column}>
            <Text style={styles.timeText}>{departureTimeStr}</Text>
            <Text style={styles.stationText} numberOfLines={1}>
              {departureStation?.split(',')[0]}
            </Text>
          </View>

          {/* MIDDLE COLUMN: Duration + Arrow (Flex increased to squeeze content) */}
          <View style={styles.centerColumn}>
            <View style={styles.arrowWrapper}>
              <View style={styles.line} />
              <View style={styles.durationContainer}>
                <Text style={styles.durationLabel}>{readableDuration}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.arrowHead} />
            </View>
          </View>

          {/* RIGHT COLUMN: Arrival */}
          <View style={[styles.column, { alignItems: 'flex-end' }]}>
            <Text style={styles.timeText}>{arrivalTimeStr}</Text>
            <Text style={styles.stationText} numberOfLines={1}>
              {arrivalStation?.split(',')[0]}
            </Text>
          </View>

        </View>

        {/* FOOTER: Reduced padding/margin */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.detailsBtn, { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }]} 
            onPress={() => setShowDetails(true)}
          >
            <Text style={styles.detailsBtnText}>Détails</Text>
            <Ionicons name="chevron-down" size={12} color={colors.blue} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bookButton, isActionLoading && { opacity: 0.7 }]} 
            onPress={handlePress}
            disabled={isActionLoading}
          >
             {isActionLoading ? (
               <ActivityIndicator size="small" color="white" />
             ) : (
               <Text style={styles.bookText}>Réserver</Text>
             )}
          </TouchableOpacity>
        </View>

      </TouchableOpacity>
      <GlobalLoadingOverlay 
        visible={isActionLoading} 
        companyLogo={logoUrl} 
      />
      <TripDetailsModal
        isVisible={showDetails}
        onClose={() => setShowDetails(false)}
        onBook={handlePress}
        loading={isActionLoading}
        data={{
          departureTime: departureTimeStr,
          arrivalTime: arrivalTimeStr,
          departureStation: getAttrValue("departure-station") || "",
          arrivalStation: getAttrValue("arrival-station") || "",
          duration: readableDuration || "",
          company: getAttrValue("bus-operator") || "",
          price: `${price?.amount} ${price?.currency}`,
          ameneties:getAttrValues("amenities"),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12, // Slightly tighter corners
    padding: 12, // Reduced padding
    marginBottom: 8, // Reduced margin
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  companyRow: { flexDirection: 'row', alignItems: 'center' },
  companyName: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  priceText: { fontSize: 16, fontWeight: '800', color: colors.blue },

  tripBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 6, // Squeezed vertical padding
  },
  column: {
    flex: 1,
  },
  timeText: {
    fontSize: 18, // Reduced from 22
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2
  },
  stationText: {
    fontSize: 11, // Reduced from 12
    color: '#94A3B8',
    fontWeight: '500'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8, // Reduced from 15
    paddingTop: 8, // Reduced from 12
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  bookButton: {
    backgroundColor: colors.red,
    paddingVertical: 6, // Squeezed padding
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bookText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  centerColumn: {
    flex: 1.2,
    justifyContent: 'center',
    paddingTop: 10,
  },
  arrowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  durationContainer: {
    paddingHorizontal: 4,
  },
  durationLabel: {
    fontSize: 9, // Slightly smaller
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  arrowHead: {
    width: 6,
    height: 6,
    borderTopWidth: 1.2,
    borderRightWidth: 1.2,
    borderColor: '#CBD5E1',
    transform: [{ rotate: '45deg' }],
    marginLeft: -5,
  },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailsBtnText: { color: colors.blue, fontSize: 12, fontWeight: '600' },
});