import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { Divider, PaddedView, Text, View, colors } from "../Themed";
import { useCartContext } from "../../context/useCartContext";
import { getTripInformation } from '../../utils/attribute';
import { TripDetailsContent } from '../products/TripDetails/TripDetailsContent';
import { PassengerModal } from './PassengerModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TripArrow = ({ duration }: { duration: string }) => (
  <View style={styles.arrowWrapper}>
    <View style={styles.line} />
    <View style={styles.durationContainer}>
      <Text style={styles.durationLabel}>{duration}</Text>
    </View>
    <View style={styles.line} />
    <View style={styles.arrowHead} />
  </View>
);

const CartScreen = () => {
  const { cart, updateItemQuantity, loading } = useCartContext();
  const navigation = useRouter();
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const line = cart?.lines?.[0];
  const variant = line?.variant;
  const attributes = variant?.attributes || [];
  const passengerCount = line?.quantity ?? 1;

  const {
    departureCity,
    departureStation,
    arrivalCity,
    arrivalStation,
    formattedDate,
    company,
    departureTimeStr,
    readableDuration,
    arrivalTimeStr,
  } = getTripInformation({ attributes });

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  const displayDate = capitalize(formattedDate);
  const depCityDisplay = departureCity?.toUpperCase();
  const arrCityDisplay = arrivalCity?.toUpperCase();



  if (!cart || cart.lines.length === 0) {
    return (
      <View style={styles.emptyCartContainer}>
        <Ionicons name="cart-outline" size={80} color="#E2E8F0" />
        <Text style={styles.emptyCartText}>Votre panier est vide</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.push("/")}>
          <Text style={styles.goBackText}>Rechercher un trajet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalAmount = cart.totalPrice?.gross?.amount ?? 0;
  const currency = cart.totalPrice?.gross?.currency ?? "XOF";

  const handleUpdateQty = (newQty: number) => {
    if (newQty < 1 || !line?.id) return;
    updateItemQuantity(line.id, newQty);
  };

  const getAttrValues = (slug: string) => {
    const found = attributes.find((attr) => attr.attribute?.slug === slug);
    return found?.values;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.back()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Résumé du voyage</Text>

        <TouchableOpacity 
          style={styles.passengerTrigger} 
          onPress={() => setShowPassengerModal(true)}
        >
          {/* Separate background for count */}
          <View style={styles.countBadge}>
             <Text style={styles.passengerCountText}>{passengerCount}</Text>
          </View>
          
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={20} color={colors.blue} />
            {/* The + sign positioned as a superscript index */}
            <Text style={styles.plusSuperscript}>+</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <PaddedView>
          <Text style={styles.sectionTitle}>Départ</Text>
          <Text style={styles.routeSubtitle}>
            {depCityDisplay} › {arrCityDisplay} • {displayDate}
          </Text>

          <View style={styles.tripCard}>
            <View style={styles.companyRow}>
              {variant?.product?.thumbnail?.url ? (
                <Image source={{ uri: variant.product.thumbnail.url }} style={styles.companyLogo} />
              ) : (
                <FontAwesome5 name="bus" size={16} color="#64748B" />
              )}
              <Text style={styles.companyName}>{company || "Compagnie"}</Text>
            </View>

            <View style={styles.itineraryRow}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{departureTimeStr}</Text>
                <Text style={styles.stationText} numberOfLines={1}>{departureStation}</Text>
              </View>

              <View style={styles.centerColumn}>
                <TripArrow duration={readableDuration || ""} />
              </View>

              <View style={[styles.timeBox, { alignItems: 'flex-end' }]}>
                <Text style={styles.timeText}>{arrivalTimeStr}</Text>
                <Text style={styles.stationText} numberOfLines={1}>{arrivalStation}</Text>
              </View>
            </View>

            {/* Toggle Button for Details */}
            <View style={styles.cardFooter}>
              <TouchableOpacity 
                style={styles.detailsBtn} 
                onPress={() => setShowDetails(!showDetails)}
              >
                <Text style={styles.detailsBtnText}>{"Détails"}</Text>
                <Ionicons name={showDetails ? "chevron-up" : "chevron-down"} size={12} color={colors.blue} />
              </TouchableOpacity>
            </View>

            {/* Inline Details Content */}
            {showDetails && (
              <View style={styles.inlineDetailsContainer}>
                <Divider style={{ marginVertical: 15 }} />
                <TripDetailsContent 
                  data={{
                    departureTime: departureTimeStr,
                    arrivalTime: arrivalTimeStr || "",
                    departureStation: departureStation || "",
                    arrivalStation: arrivalStation || "",
                    duration: readableDuration || "",
                    company: company || "",
                    price: `${totalAmount} ${currency}`,
                    ameneties: getAttrValues("amenities"),
                  }} 
                />
              </View>
            )}

            <Divider style={{ marginVertical: 16, backgroundColor: '#F1F5F9' }} />

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Total voyageur(s)</Text>
                <Text style={styles.passengerDetail}>{passengerCount} x Billet</Text>
              </View>
              <Text style={styles.priceValue}>{totalAmount} {currency}</Text>
            </View>
          </View>
        </PaddedView>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.checkoutBtn, loading && { opacity: 0.7 }]} 
          onPress={() => navigation.push('/checkout')}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.checkoutBtnText}>Réserver {totalAmount} {currency}</Text>
          )}
        </TouchableOpacity>
      </View>

      <PassengerModal 
        isVisible={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        count={passengerCount}
        onConfirm={handleUpdateQty}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerIconBtn: { width: 40 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase' },
  
  passengerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // Subtle grey for the whole button
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  countBadge: {
    backgroundColor: colors.blue, // Primary color for the number
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerCountText: { 
    fontWeight: 'bold', 
    color: 'white', 
    fontSize: 13 
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  plusSuperscript: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.blue,
    marginTop: -4, // Moves it up like an index
    marginLeft: 1,
  },
  scroll: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 15,marginBottom:10 },
  routeSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 20 },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth:1,
    borderColor:"#CBD5E1",
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  companyLogo: { width: 80, height: 25, resizeMode: 'contain' },
  companyName: { fontSize: 14, color: '#475569', fontWeight: '600' },
  itineraryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeBox: { flex: 2 },
  timeText: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  stationText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  centerColumn: { flex: 1.5, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  arrowWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 1, backgroundColor: '#CBD5E1' },
  durationContainer: { paddingHorizontal: 4 },
  durationLabel: { fontSize: 9, color: '#64748B', fontWeight: '700', textTransform: 'lowercase' },
  arrowHead: {
    width: 6,
    height: 6,
    borderTopWidth: 1.2,
    borderRightWidth: 1.2,
    borderColor: '#CBD5E1',
    transform: [{ rotate: '45deg' }],
    marginLeft: -5,
  },
  cardFooter: { marginTop: 15, flexDirection: 'row', justifyContent: 'flex-start' },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  detailsBtnText: { color: colors.blue, fontSize: 12, fontWeight: '600' },
  inlineDetailsContainer: { width: '100%', minHeight: 200 }, // Ensure it doesn't jump too much
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold' },
  passengerDetail: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  priceValue: { fontSize: 22, fontWeight: '900', color: colors.blue },
  footer: { padding: 24, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  checkoutBtn: { backgroundColor: colors.red, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  checkoutBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  emptyCartContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCartText: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 20 },
  goBackButton: { marginTop: 10, backgroundColor: '#F1F5F9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  goBackText: { color: colors.blue, fontWeight: 'bold' },
});

export default CartScreen;