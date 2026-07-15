import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { generateShortCode } from '../../utils/generateShortCode';
import { OrderFragment } from '../../saleor/api.generated';
import { getTripInformation } from '../../utils/attribute';
import { PLATFORM_FEE_PRODUCT_SLUG } from '../../utils/ensurePlatformFeeInCheckout';
import { colors } from '../Themed';

const { width } = Dimensions.get('window');
const TICKET_PROOF_IMAGE_URL_KEY = "ticket_proof_image_url";
type OrderMetadataItem = { key: string; value: string };

export const TicketModalContent = ({ order }: { order: OrderFragment }) => {
  const ticketLines = order.lines.filter(
    (line) => line.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG
  );
  const ticketLine = ticketLines[0] ?? order.lines[0];
  const ticketCount = ticketLines.reduce((sum, line) => sum + line.quantity, 0);
  const attributes = ticketLine?.variant?.attributes || [];
  const { departureCity, arrivalCity, departureTimeStr, arrivalTimeStr, company, formattedDate } = getTripInformation({ attributes });
  const confirmationCode = generateShortCode(order.id);
  const orderMetadata = ((order as OrderFragment & { metadata?: OrderMetadataItem[] }).metadata ?? []);
  const ticketImageUrl = orderMetadata.find((item) => item.key === TICKET_PROOF_IMAGE_URL_KEY)?.value;

  // LOGIQUE DE PARSING POUR TOUS LES PASSAGERS
  const getPassengers = () => {
    if (!order.customerNote) return ["Passager"];
    
    try {
      // Split par ";" pour avoir chaque bloc passager
      const passengerBlocks = order.customerNote.split(';').filter(p => p.trim() !== "");
      
      return passengerBlocks.map(block => {
        const [lastName, firstName] = block.split(',');
        if (firstName && lastName) {
          return `${firstName.trim()} ${lastName.trim()}`;
        }
        return block.trim();
      });
    } catch (e) {
      return [order.customerNote || "Passager"];
    }
  };

  const allPassengers = getPassengers();

  return (
    <View style={styles.ticketContainer}>
      {/* Partie Haute */}
      <View style={styles.topSection}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.companyName}>{company}</Text>
      </View>

      <View style={styles.dashedLine} />

      {/* Partie Centrale : Trajet */}
      <View style={styles.bodySection}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Départ</Text>
            <Text style={styles.time}>{departureTimeStr}</Text>
            <Text style={styles.city}>{departureCity}</Text>
          </View>
          <MaterialCommunityIcons name="bus-side" size={24} color="#CBD5E1" />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Arrivée</Text>
            <Text style={styles.time}>{arrivalTimeStr}</Text>
            <Text style={styles.city}>{arrivalCity}</Text>
          </View>
        </View>

        {/* Date et Nombre de places */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Date du voyage</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
          <View style={[styles.infoItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.label}>Places</Text>
            <Text style={styles.infoValue}>{ticketCount}</Text>
          </View>
        </View>

        {/* Liste des Passagers */}
        <View style={styles.passengerListContainer}>
          <Text style={styles.label}>Passagers</Text>
          {allPassengers.map((name, index) => (
            <View key={index} style={styles.passengerRow}>
              <MaterialCommunityIcons name="account" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.passengerName}>{name}</Text>
            </View>
          ))}
        </View>

        {/* Détails du Prix */}
        <View style={styles.priceContainer}>
           <Text style={styles.label}>Paiement Confirmé</Text>
           <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Montant Total</Text>
              <Text style={styles.priceValue}>{order.total.gross.amount} {order.total.gross.currency}</Text>
           </View>
        </View>
      </View>

      <View style={styles.dashedLine} />

      {/* Partie Basse : Photo du billet et QR optionnel */}
      <View style={styles.footerSection}>
        <Text style={styles.qrLabel}>Photo du billet physique</Text>

        {ticketImageUrl ? (
          <Image source={{ uri: ticketImageUrl }} style={styles.ticketProofImage} resizeMode="contain" />
        ) : (
          <View style={styles.ticketProofPlaceholder}>
            <MaterialCommunityIcons name="image-outline" size={32} color={colors.green} />
            <Text style={styles.ticketProofPlaceholderText}>
              La photo du billet sera disponible après la validation par la compagnie.
            </Text>
          </View>
        )}

        <View style={styles.confirmationWrapper}>
            <Text style={styles.label}>Code de Confirmation</Text>
            <Text style={styles.codeText}>{confirmationCode}</Text>
        </View>

        <View style={styles.optionalQrBlock}>
          <Text style={styles.optionalQrLabel}>Scan optionnel</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={order.id}
              size={92}
              color="#111827"
              backgroundColor="white"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ticketContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: width * 0.90,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    marginVertical: 10,
    overflow: 'hidden'
  },
  topSection: { padding: 20, alignItems: 'center' },
  logo: { width: 140, height: 45 },
  companyName: { fontSize: 13, fontFamily: 'TTNormsPro-Bold', color: '#606060', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  dashedLine: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: 15 },
  bodySection: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  infoItem: { flex: 1 },
  label: { fontSize: 10, color: '#606060', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'TTNormsPro-Bold', letterSpacing: 0.5 },
  time: { fontSize: 20, fontFamily: 'TTNormsPro-Bold', color: '#000000' },
  city: { fontSize: 13, color: '#606060', fontFamily: 'TTNormsPro-Regular' },
  infoValue: { fontSize: 15, fontFamily: 'TTNormsPro-Bold', color: '#000000' },
  
  // Styles pour la liste des passagers
  passengerListContainer: {
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 15
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  passengerName: {
    fontSize: 14,
    fontFamily: 'TTNormsPro-Regular',
    color: '#000000',
    textTransform: 'capitalize'
  },

  priceContainer: {
    backgroundColor: '#F1F1F1',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7D8DB'
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  priceLabel: { fontSize: 12, color: '#606060', fontFamily: 'TTNormsPro-Regular' },
  priceValue: { fontSize: 15, fontFamily: 'TTNormsPro-Bold', color: '#16A34A' },

  footerSection: { 
    padding: 20, 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
  },
  qrLabel: { fontSize: 10, fontFamily: 'TTNormsPro-Bold', color: '#606060', textTransform: 'uppercase', marginBottom: 10 },
  ticketProofImage: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7D8DB',
    backgroundColor: '#F1F1F1',
    marginBottom: 16,
  },
  ticketProofPlaceholder: {
    width: '100%',
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D7D8DB',
    backgroundColor: '#E6F5F3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginBottom: 16,
  },
  ticketProofPlaceholderText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: colors.green,
    fontFamily: 'TTNormsPro-Regular',
    textAlign: 'center',
  },
  qrContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7D8DB',
  },
  confirmationWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeText: { fontSize: 28, fontFamily: 'TTNormsPro-Bold', color: '#000000', letterSpacing: 6 },
  optionalQrBlock: {
    alignItems: 'center',
    opacity: 0.85,
  },
  optionalQrLabel: {
    fontSize: 10,
    color: '#606060',
    fontFamily: 'TTNormsPro-Bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});