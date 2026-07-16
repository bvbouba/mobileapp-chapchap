import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, Divider, PaddedView, Text, View } from "../Themed";
import { useCartContext } from "../../context/useCartContext";
import { getTripInformation } from '../../utils/attribute';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { ensurePlatformFeeLineInCheckout } from "../../utils/ensurePlatformFeeInCheckout";
import {
  useCheckoutLinesAddMutation,
  useGetProductBySlugLazyQuery,
} from "../../saleor/api.generated";
import { EllipsisLoader } from '../EllipsisLoader';
import { TripDetailsContent } from '../products/TripDetails/TripDetailsContent';
import { PassengerModal } from './PassengerModal';

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
  const { cart, updateItemQuantity, loading, refreshCart } = useCartContext();
  const navigation = useRouter();
  const insets = useSafeAreaInsets();
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [checkoutNavigating, setCheckoutNavigating] = useState(false);

  const [fetchPlatformFeeProduct] = useGetProductBySlugLazyQuery();
  const [checkoutLinesAdd] = useCheckoutLinesAddMutation();

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

  const displayDate = formattedDate;
  const depCityDisplay = departureCity?.toUpperCase();
  const arrCityDisplay = arrivalCity?.toUpperCase();



  if (!cart || cart.lines.length === 0) {
    return (
      <View style={styles.emptyCartContainer}>
        <Ionicons name="cart-outline" size={80} color="#E2E8F0" />
        <Text style={styles.emptyCartText}>Votre panier est vide</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.push("/")} activeOpacity={0.85}>
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
  const companyLogoUrl = resolveMediaUrl(variant?.product?.thumbnail?.url);

  const handleGoToCheckout = async () => {
    if (!cart?.id || loading || checkoutNavigating) return;
    setCheckoutNavigating(true);
    try {
      const feeResult = await ensurePlatformFeeLineInCheckout({
        checkoutId: cart.id,
        lines: cart.lines,
        // The fee product must be fetched in the same channel as the checkout.
        channel: cart.channel?.slug ?? "",
        fetchProductBySlug: (args) => fetchPlatformFeeProduct(args),
        checkoutLinesAdd: (args) => checkoutLinesAdd(args),
        refreshCart,
      });
  
      if (!feeResult.ok && feeResult.reason === "mutation_error") {
        Alert.alert(
          "Erreur",
          feeResult.message || "Impossible d'ajouter les frais de plateforme au panier."
        );
        return;
      }

      navigation.push("/checkout");
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de continuer vers la validation.");
    } finally {
      setCheckoutNavigating(false);
    }
  };

  const checkoutBusy = loading || checkoutNavigating;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.back()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={22} color="#000000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Résumé du voyage</Text>

        <TouchableOpacity 
          style={styles.passengerTrigger} 
          onPress={() => setShowPassengerModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.countBadge}>
             <Text style={styles.passengerCountText}>{passengerCount}</Text>
          </View>
          
          <View style={styles.iconContainer}>
            <Ionicons name="person-add-outline" size={15} color={colors.green} />
            <Text style={styles.passengerActionText}>Passagers</Text>
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
              {companyLogoUrl ? (
                <Image source={{ uri: companyLogoUrl }} style={styles.companyLogo} />
              ) : (
                <View style={styles.companyIconFallback}>
                  <FontAwesome5 name="bus" size={13} color="#606060" />
                </View>
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
                activeOpacity={0.85}
              >
                <Text style={styles.detailsBtnText}>{"Détails"}</Text>
                <Ionicons name={showDetails ? "chevron-up" : "chevron-down"} size={12} color={colors.green} />
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={[styles.checkoutBtn, checkoutBusy && { opacity: 0.7 }]}
          onPress={handleGoToCheckout}
          disabled={checkoutBusy}
        >
          {checkoutBusy ? (
            <EllipsisLoader color="#FFFFFF" dotSize={7} />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D7D8DB'
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'TTNormsPro-Bold',
  },
  
  passengerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D7D8DB'
  },
  countBadge: {
    backgroundColor: colors.green,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerCountText: { 
    fontFamily: 'TTNormsPro-Bold',
    color: 'white', 
    fontSize: 13 
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    borderRadius: 999,
    paddingRight: 2,
  },
  passengerActionText: {
    marginLeft: 4,
    color: colors.green,
    fontSize: 12,
    fontFamily: 'TTNormsPro-Bold',
  },
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  sectionTitle: {
    fontSize: 22,
    color: '#000000',
    marginTop: 15,
    marginBottom: 10,
    fontFamily: 'TTNormsPro-Bold',
  },
  routeSubtitle: {
    fontSize: 12,
    color: '#606060',
    marginBottom: 16,
    fontFamily: 'TTNormsPro-Regular',
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7D8DB',
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  companyLogo: { width: 110, height: 100, resizeMode: 'contain' },
  companyIconFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#D7D8DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: { fontSize: 13, color: '#606060', fontFamily: 'TTNormsPro-Regular' },
  itineraryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  timeBox: { flex: 2 },
  timeText: { fontSize: 20, color: '#000000', fontFamily: 'TTNormsPro-Bold' },
  stationText: { fontSize: 11, color: '#606060', marginTop: 4, fontFamily: 'TTNormsPro-Regular' },
  centerColumn: { flex: 1.2, justifyContent: 'center', paddingTop: 10 },
  arrowWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 1, backgroundColor: '#CBD5E1' },
  durationContainer: { paddingHorizontal: 4 },
  durationLabel: { fontSize: 9, color: '#606060', fontFamily: 'TTNormsPro-Bold', textTransform: 'lowercase' },
  arrowHead: {
    width: 6,
    height: 6,
    borderTopWidth: 1.2,
    borderRightWidth: 1.2,
    borderColor: '#CBD5E1',
    transform: [{ rotate: '45deg' }],
    marginLeft: -5,
  },
  cardFooter: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-start' },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#D7D8DB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  detailsBtnText: { color: colors.green, fontSize: 12, fontFamily: 'TTNormsPro-Bold' },
  inlineDetailsContainer: { width: '100%', minHeight: 200 }, // Ensure it doesn't jump too much
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { fontSize: 12, color: '#606060', textTransform: 'uppercase', fontFamily: 'TTNormsPro-Bold' },
  passengerDetail: { fontSize: 14, color: '#000000', fontFamily: 'TTNormsPro-Regular' },
  priceValue: { fontSize: 20, color: colors.green, fontFamily: 'TTNormsPro-Bold' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D7D8DB',
    marginBottom: 10,
  },
  checkoutBtn: {
    backgroundColor: '#EB1700',
    height: 52,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnText: { color: 'white', fontSize: 16, fontFamily: 'TTNormsPro-Bold' },
  emptyCartContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCartText: { fontSize: 20, color: '#000000', marginTop: 20, fontFamily: 'TTNormsPro-Bold' },
  goBackButton: {
    marginTop: 12,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#D7D8DB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  goBackText: { color: colors.green, fontFamily: 'TTNormsPro-Bold' },
});

export default CartScreen;